import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as prettier from 'prettier';

export function activate(context: vscode.ExtensionContext) {
    // Comando principal da extensão
    const disposable = vscode.commands.registerCommand('extension.reorderHoisting', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage('No active file found.');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'typescript') {
            vscode.window.showErrorMessage('This command only works with TypeScript files.');
            return;
        }

        const code = document.getText();
        const updatedCode = reorderCode(code);

        try {
            // Detectar se Prettier está instalado
            const prettierExtension = vscode.extensions.getExtension('esbenp.prettier-vscode');
            const formattedCode = prettierExtension
                ? await formatWithPrettier(updatedCode)
                : updatedCode; // Sem Prettier, retorna o código original atualizado

            // Atualizar o documento com o código formatado
            await applyEdits(document, formattedCode);

            // vscode.window.showInformationMessage('Reordering and formatting completed successfully!');
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

async function formatWithPrettier(code: string): Promise<string> {
    const prettierConfig = await prettier.resolveConfig(process.cwd());
    return prettier.format(code, { ...prettierConfig, parser: 'typescript' });
}

async function applyEdits(document: vscode.TextDocument, formattedCode: string) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
    );

    edit.replace(document.uri, fullRange, formattedCode);
    await vscode.workspace.applyEdit(edit);
}

function showEnvironmentInfo() {
    const vscodeVersion = vscode.version;
    const prettierExtension = vscode.extensions.getExtension('esbenp.prettier-vscode');

    // vscode.window.showInformationMessage(`Running on VS Code version: ${vscodeVersion}`);
    if (prettierExtension) {
        // vscode.window.showInformationMessage('Prettier extension detected.');
    } else {
        // vscode.window.showWarningMessage('Prettier extension not detected. Using default formatting.');
    }
}

function handleError(error: unknown) {
    if (error instanceof Error) {
        console.error('Error:', error);
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    } else {
        console.error('Unknown error:', error);
        vscode.window.showErrorMessage('Unknown error occurred.');
    }
}

export function deactivate() {}
