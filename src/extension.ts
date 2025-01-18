import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as prettier from 'prettier';

export function activate(context: vscode.ExtensionContext) {
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

        // Formatar o código com Prettier
        const formattedCode = prettier.format(updatedCode, { 
            parser: 'typescript',
            semi: true,  // Mantém os pontos e vírgulas
            singleQuote: true,  // Usa aspas simples
            trailingComma: 'all',  // Adiciona vírgulas finais onde possível
            bracketSpacing: true,  // Mantém espaços dentro de objetos
            tabWidth: 2,  // Asegure-se de que a indentação está configurada corretamente
            useTabs: true,
        });

        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(code.length)
        );

        // Substituir o código formatado no documento
        edit.replace(document.uri, fullRange, await formattedCode);
        
        // Aplicar o edit no workspace
        await vscode.workspace.applyEdit(edit);

        vscode.window.showInformationMessage('Reordenamento e formatação concluídos com sucesso!');
    });

    context.subscriptions.push(disposable);
}

function reorderCode(code: string): string {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

    const printer = ts.createPrinter();

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

    // Retornar os membros reordenados
    return [...others, ...methods];
}

export function deactivate() {}
