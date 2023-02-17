/**
 * @author Ali Gençay
 * https://github.com/kbmjj123/zd-vscode-chatgpt
 *
 * @license
 * Copyright (c) 2022 - Present, Ali Gençay
 *
 * All rights reserved. Code licensed under the MIT license
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

import * as vscode from "vscode";
import ChatGptViewProvider from './chatgpt-view-provider';

export async function activate(context: vscode.ExtensionContext) {
    const chatGptExtensionConfig = vscode.workspace.getConfiguration("chatgpt");
    const provider = new ChatGptViewProvider(context);

    const view = vscode.window.registerWebviewViewProvider(
        "zd-vscode-chatgpt.view",
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
        }
    );

    const freeText = vscode.commands.registerCommand("zd-vscode-chatgpt.freeText", async () => {
        const value = await vscode.window.showInputBox({
            prompt: "Ask anything...",
        });

        if (value) {
            provider?.sendApiRequest(value);
        }
    });

    const resetThread = vscode.commands.registerCommand("zd-vscode-chatgpt.clearConversation", async () => {
        provider?.sendMessage({ type: 'clearConversation' }, true);
    });

    const exportConversation = vscode.commands.registerCommand("zd-vscode-chatgpt.exportConversation", async () => {
        provider?.sendMessage({ type: 'exportConversation' }, true);
    });

    const clear = vscode.commands.registerCommand("zd-vscode-chatgpt.clearSession", () => {
        context.globalState.update("chatgpt-session-token", null);
    });

    const configChanged = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('chatgpt.response.showNotification')) {
            provider.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt").get("response.showNotification") || false;
        }
    });

    const commands = [
        ["zd-vscode-chatgpt.addTests", "promptPrefix.addTests"],
        ["zd-vscode-chatgpt.findProblems", "promptPrefix.findProblems"],
        ["zd-vscode-chatgpt.optimize", "promptPrefix.optimize"],
        ["zd-vscode-chatgpt.explain", "promptPrefix.explain"],
    ];

    const registeredCommands = commands.map(([command, configKey]) =>
        vscode.commands.registerCommand(command, () => {
            const commandPrefix = chatGptExtensionConfig.get(configKey) as string;
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.document.getText(editor.selection);
            if (selection) {
                provider?.sendApiRequest(commandPrefix, selection);
            }
        })
    );

    context.subscriptions.push(view, freeText, resetThread, exportConversation, clear, configChanged, ...registeredCommands);
}

export function deactivate() { }
