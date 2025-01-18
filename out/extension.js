"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ts = __importStar(require("typescript"));
const prettier = __importStar(require("prettier"));
function activate(context) {
    const disposable = vscode.commands.registerCommand('extension.reorderHoisting', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Nenhum arquivo ativo encontrado.');
            return;
        }
        const document = editor.document;
        if (document.languageId !== 'typescript') {
            vscode.window.showErrorMessage('Este comando funciona apenas com arquivos TypeScript.');
            return;
        }
        const code = document.getText();
        const updatedCode = reorderCode(code);
        try {
            // Formatar o código com Prettier
            const formattedCode = await prettier.format(updatedCode, {
                parser: 'typescript',
                semi: true, // Mantém os pontos e vírgulas
                singleQuote: true, // Usa aspas simples
                trailingComma: 'all', // Adiciona vírgulas finais onde possível
                bracketSpacing: true, // Mantém espaços dentro de objetos
                tabWidth: 2, // Asegure-se de que a indentação está configurada corretamente
                useTabs: true, // Usar tabulações para indentação
            });
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(code.length));
            // Substituir o código formatado no documento
            edit.replace(document.uri, fullRange, formattedCode);
            // Aplicar o edit no workspace
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Reordenamento e formatação concluídos com sucesso!');
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Erro ao formatar o código:", error);
                vscode.window.showErrorMessage(`Erro ao formatar o código: ${error.message}`);
            }
            else {
                console.error("Erro desconhecido:", error);
                vscode.window.showErrorMessage('Erro desconhecido ao formatar o código.');
            }
        }
    });
    context.subscriptions.push(disposable);
}
function reorderCode(code) {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    const printer = ts.createPrinter();
    const transformer = (context) => {
        return (rootNode) => {
            function visit(node) {
                if (ts.isClassDeclaration(node) && node.members) {
                    const orderedMembers = reorderClassMembers(node.members);
                    return ts.factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, orderedMembers);
                }
                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitEachChild(rootNode, visit, context);
        };
    };
    const transformed = ts.transform(sourceFile, [transformer]);
    const updatedSourceFile = transformed.transformed[0];
    const resultCode = printer.printFile(updatedSourceFile);
    transformed.dispose();
    return resultCode;
}
function reorderClassMembers(members) {
    const methods = [];
    const others = [];
    members.forEach((member) => {
        if (ts.isMethodDeclaration(member)) {
            methods.push(member);
        }
        else {
            others.push(member);
        }
    });
    methods.sort((a, b) => {
        const nameA = a.name.getText();
        const nameB = b.name.getText();
        return nameA.localeCompare(nameB);
    });
    // Retornar os membros reordenados
    return [...others, ...methods];
}
function deactivate() { }
