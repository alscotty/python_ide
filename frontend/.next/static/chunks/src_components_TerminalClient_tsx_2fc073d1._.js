(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_components_TerminalClient_tsx_2fc073d1._.js", {

"[project]/src/components/TerminalClient.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>TerminalClient)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xterm$2f$lib$2f$xterm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xterm/lib/xterm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xterm$2d$addon$2d$fit$2f$lib$2f$xterm$2d$addon$2d$fit$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xterm-addon-fit/lib/xterm-addon-fit.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xterm$2d$addon$2d$web$2d$links$2f$lib$2f$xterm$2d$addon$2d$web$2d$links$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/xterm-addon-web-links/lib/xterm-addon-web-links.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function TerminalClient({ output, onCommand }) {
    _s();
    const terminalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const xtermRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fitAddonRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [currentLine, setCurrentLine] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [commandHistory, setCommandHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [historyIndex, setHistoryIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(-1);
    const [isOutputting, setIsOutputting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Initialize terminal
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TerminalClient.useEffect": ()=>{
            if (!terminalRef.current) return;
            const xterm = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xterm$2f$lib$2f$xterm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Terminal"]({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                theme: {
                    background: '#1a1a1a',
                    foreground: '#ffffff'
                },
                allowTransparency: true
            });
            const fitAddon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xterm$2d$addon$2d$fit$2f$lib$2f$xterm$2d$addon$2d$fit$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FitAddon"]();
            xterm.loadAddon(fitAddon);
            xterm.loadAddon(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$xterm$2d$addon$2d$web$2d$links$2f$lib$2f$xterm$2d$addon$2d$web$2d$links$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebLinksAddon"]());
            xterm.open(terminalRef.current);
            fitAddon.fit();
            // Write initial prompt
            xterm.write('$ ');
            // Handle input
            xterm.onData({
                "TerminalClient.useEffect": (data)=>{
                    const code = data.charCodeAt(0);
                    // Handle special keys
                    if (code === 13) {
                        if (currentLine.trim()) {
                            onCommand(currentLine);
                            setCommandHistory({
                                "TerminalClient.useEffect": (prev)=>[
                                        ...prev,
                                        currentLine
                                    ]
                            }["TerminalClient.useEffect"]);
                            setHistoryIndex(-1);
                            setCurrentLine('');
                            xterm.write('\r\n$ ');
                        } else {
                            xterm.write('\r\n$ ');
                        }
                    } else if (code === 8) {
                        if (currentLine.length > 0) {
                            setCurrentLine({
                                "TerminalClient.useEffect": (prev)=>prev.slice(0, -1)
                            }["TerminalClient.useEffect"]);
                            xterm.write('\b \b');
                        }
                    } else if (code === 27) {
                        const sequence = data.slice(1);
                        if (sequence === '[A') {
                            if (historyIndex < commandHistory.length - 1) {
                                const newIndex = historyIndex + 1;
                                setHistoryIndex(newIndex);
                                const command = commandHistory[commandHistory.length - 1 - newIndex];
                                setCurrentLine(command);
                                xterm.write('\r$ ' + command);
                            }
                        } else if (sequence === '[B') {
                            if (historyIndex > 0) {
                                const newIndex = historyIndex - 1;
                                setHistoryIndex(newIndex);
                                const command = commandHistory[commandHistory.length - 1 - newIndex];
                                setCurrentLine(command);
                                xterm.write('\r$ ' + command);
                            } else {
                                setHistoryIndex(-1);
                                setCurrentLine('');
                                xterm.write('\r$ ');
                            }
                        }
                    } else if (code >= 32) {
                        setCurrentLine({
                            "TerminalClient.useEffect": (prev)=>prev + data
                        }["TerminalClient.useEffect"]);
                        xterm.write(data);
                    }
                }
            }["TerminalClient.useEffect"]);
            xtermRef.current = xterm;
            fitAddonRef.current = fitAddon;
            const handleResize = {
                "TerminalClient.useEffect.handleResize": ()=>{
                    fitAddon.fit();
                }
            }["TerminalClient.useEffect.handleResize"];
            window.addEventListener('resize', handleResize);
            return ({
                "TerminalClient.useEffect": ()=>{
                    window.removeEventListener('resize', handleResize);
                    xterm.dispose();
                }
            })["TerminalClient.useEffect"];
        }
    }["TerminalClient.useEffect"], []); // Empty dependency array for initialization
    // Handle output updates
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TerminalClient.useEffect": ()=>{
            if (xtermRef.current && output && !isOutputting) {
                setIsOutputting(true);
                xtermRef.current.write(output);
                xtermRef.current.write('\r\n$ ');
                setIsOutputting(false);
            }
        }
    }["TerminalClient.useEffect"], [
        output,
        isOutputting
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: terminalRef,
        className: "h-full w-full bg-gray-900 rounded-lg overflow-hidden"
    }, void 0, false, {
        fileName: "[project]/src/components/TerminalClient.tsx",
        lineNumber: 122,
        columnNumber: 5
    }, this);
}
_s(TerminalClient, "O3tAZUZ4CQ5waoi77HROhNS7VuU=");
_c = TerminalClient;
var _c;
__turbopack_context__.k.register(_c, "TerminalClient");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/TerminalClient.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/TerminalClient.tsx [app-client] (ecmascript)"));
}}),
}]);

//# sourceMappingURL=src_components_TerminalClient_tsx_2fc073d1._.js.map