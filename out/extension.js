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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ts = __importStar(require("typescript"));
function activate(context) {
    const disposable = vscode.commands.registerCommand('extension.reorderHoisting', () => __awaiter(this, void 0, void 0, function* () {
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
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(code.length));
        edit.replace(document.uri, fullRange, updatedCode);
        yield vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage('Reordenamento concluído com sucesso!');
    }));
    context.subscriptions.push(disposable);
}
function reorderCode(code) {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
    const printer = ts.createPrinter();
    const transformer = (context) => {
        return (rootNode) => {
            function visit(node) {
                // Reordenar somente dentro de declarações de classe
                if (ts.isClassDeclaration(node) && node.members) {
                    const orderedMembers = reorderClassMembers(node.members);
                    return ts.factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, orderedMembers);
                }
                return ts.visitEachChild(node, visit, context);
            }
            // Certifique-se de que o nó retornado é um SourceFile
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
    // Reordenar membros da classe: métodos antes de propriedades
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
    // Ordenar métodos por nome
    methods.sort((a, b) => {
        const nameA = a.name.getText();
        const nameB = b.name.getText();
        return nameA.localeCompare(nameB);
    });
    return [...others, ...methods];
}
function deactivate() { }
