import * as vscode from 'vscode';
import * as ts from 'typescript';

export function activate(context: vscode.ExtensionContext) {
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
        } catch (error) {
            handleError(error);
        }
    });

    context.subscriptions.push(disposable);

    // Exibir informações sobre o ambiente
    showEnvironmentInfo();
}

function reorderCode(code: string): string {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        return (rootNode) => {
            function visit(node: ts.Node): ts.Node {
                if (ts.isClassDeclaration(node) && node.members) {
                    const orderedMembers = reorderClassMembers(node.members);
                    return ts.factory.updateClassDeclaration(
                        node,
                        node.modifiers,
                        node.name,
                        node.typeParameters,
                        node.heritageClauses,
                        orderedMembers
                    );
                }
                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitEachChild(rootNode, visit, context) as ts.SourceFile;
        };
    };

    const transformed = ts.transform(sourceFile, [transformer]);
    const updatedSourceFile = transformed.transformed[0];

    const printer = ts.createPrinter();
    const resultCode = printer.printFile(updatedSourceFile);

    transformed.dispose();
    return resultCode;
}

function reorderClassMembers(members: ts.NodeArray<ts.ClassElement>): ts.ClassElement[] {
    const methods: ts.MethodDeclaration[] = [];
    const others: ts.ClassElement[] = [];

    members.forEach((member) => {
        if (ts.isMethodDeclaration(member)) {
            methods.push(member);
        } else {
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

async function applyEdits(document: vscode.TextDocument, updatedCode: string) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
    );

    edit.replace(document.uri, fullRange, updatedCode);
    await vscode.workspace.applyEdit(edit);
}

function showEnvironmentInfo() {
    const vscodeVersion = vscode.version;
    // Exibir as informações, mas sem a parte relacionada ao Prettier
    // vscode.window.showInformationMessage(`Running on VS Code version: ${vscodeVersion}`);
}

function handleError(error: unknown) {
    if (error instanceof Error) {
        console.error('Error:', error);
        // vscode.window.showErrorMessage(`Error: ${error.message}`);
    } else {
        console.error('Unknown error:', error);
        // vscode.window.showErrorMessage('Unknown error occurred.');
    }
}

export function deactivate() {}
