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
function activate(context) {
    console.log('Extension "Angular Hoisting Formatter" is now active!');
    // Comando principal da extensão
    const disposable = vscode.commands.registerCommand('extension.reorderHoisting', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            // vscode.window.showErrorMessage('No active file found.');
            return;
        }
        const document = editor.document;
        if (document.languageId !== 'typescript') {
            // vscode.window.showErrorMessage('This command only works with TypeScript files.');
            return;
        }
        const code = document.getText();
        const updatedCode = reorderCode(code);
        try {
            // Atualizar o documento com o código reordenado
            await applyEdits(document, updatedCode);
            // vscode.window.showInformationMessage('Reordering completed successfully!');
        }
        catch (error) {
            handleError(error);
        }
    });
    context.subscriptions.push(disposable);
    // Exibir informações sobre o ambiente
    showEnvironmentInfo();
}
function reorderCode(code) {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
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
    const printer = ts.createPrinter();
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
    return [...others, ...methods];
}
async function applyEdits(document, updatedCode) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
    edit.replace(document.uri, fullRange, updatedCode);
    await vscode.workspace.applyEdit(edit);
}
function showEnvironmentInfo() {
    const vscodeVersion = vscode.version;
    // Exibir as informações, mas sem a parte relacionada ao Prettier
    // vscode.window.showInformationMessage(`Running on VS Code version: ${vscodeVersion}`);
}
function handleError(error) {
    if (error instanceof Error) {
        console.error('Error:', error);
        // vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
    else {
        console.error('Unknown error:', error);
        // vscode.window.showErrorMessage('Unknown error occurred.');
    }
}
function deactivate() { }
