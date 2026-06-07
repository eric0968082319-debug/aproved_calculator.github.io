/**
 * 高級工程計算機 - 核心邏輯與表達式解析器
 * 採用玻璃擬態設計，並支援即時預覽功能。
 */

// 運算狀態全域變數
let expression = "";      // 目前使用者輸入的數學公式字串
let lastAnswer = 0;       // 前一次計算的最終結果 (Ans)
let memory = 0;           // 記憶體數值 (MC, MR, M+, M-, MS)
let isDegreeMode = true;  // 角度模式：true 為角度 (DEG)，false 為弧度 (RAD)
let isNewCalculation = false; // 標記是否剛完成一次計算，若是，下次輸入數字時將清除畫面

// 當網頁載入完成後的初始化設定
document.addEventListener("DOMContentLoaded", () => {
    updateDisplay();
    // 綁定鍵盤輸入事件
    document.addEventListener("keydown", handleKeyboardInput);
});

/**
 * 更新螢幕顯示
 * 包含公式顯示、即時結果預覽，以及指示燈狀態
 */
function updateDisplay() {
    const exprDisplay = document.getElementById("expression-display");
    const resultDisplay = document.getElementById("result-display");

    // 1. 顯示目前的數學公式
    exprDisplay.textContent = expression || "0";

    // 2. 處理即時結果預覽 (Real-time Preview)
    if (!expression) {
        resultDisplay.textContent = "0";
        resultDisplay.classList.remove("preview");
        return;
    }

    try {
        // 為了解析方便，自動補齊結尾缺失的右括號進行預覽計算
        let previewExpr = expression;
        const openParens = (previewExpr.match(/\(/g) || []).length;
        const closeParens = (previewExpr.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            previewExpr += ")".repeat(openParens - closeParens);
        }

        // 解析並求值
        const tokens = tokenize(previewExpr);
        const ast = parse(tokens);
        const val = evaluateAST(ast, isDegreeMode);

        // 更新顯示為預覽樣式 (字體較小且顏色半透明)
        resultDisplay.textContent = formatResult(val);
        resultDisplay.classList.add("preview");
    } catch (e) {
        // 若在輸入過程中公式暫時不完整 (例如 trailing '+' 或 'sin(')，預覽不更新錯誤訊息，保持安靜
    }
}

/**
 * 格式化輸出結果
 * 避免 JavaScript 浮點數精度問題 (如 0.1 + 0.2 = 0.30000000000000004)
 * @param {number} val 原始計算數值
 * @returns {string} 格式化後的字串
 */
function formatResult(val) {
    if (typeof val !== "number" || isNaN(val)) return "Error";
    if (!isFinite(val)) return "Infinity";

    // 整數直接輸出
    if (Number.isInteger(val)) return val.toString();

    // 限制最高輸出精度為 12 位有效數字
    let str = val.toPrecision(12);

    // 如果包含科學記號 (e)
    if (str.includes("e")) {
        const parts = str.split("e");
        const mantissa = parseFloat(parts[0]).toString(); // 清除尾部多餘的 0
        return mantissa + "e" + parts[1];
    }

    // 清除小數點後多餘的 0 (如 0.30000000 -> 0.3)
    return parseFloat(str).toString();
}

/**
 * 鍵入單一字元或運算子
 * @param {string} char 輸入的字元
 */
function inputChar(char) {
    // 若剛進行過計算且本次輸入為數字、常數或左括號，則自動開啟新一輪計算
    if (isNewCalculation) {
        const isOperator = ["+", "-", "×", "÷", "%", "^", "!"].includes(char);
        if (!isOperator) {
            expression = "";
        } else {
            // 如果輸入的是運算子，自動以 Ans 作為開頭
            expression = "Ans";
        }
        isNewCalculation = false;
    }

    // 限制運算式長度，防止溢出
    if (expression.length > 100) return;

    expression += char;
    updateDisplay();
}

/**
 * 鍵入科學函數名稱，自動加上左括號 '('
 * @param {string} funcName 函數名稱 (如 'sin')
 */
function inputFunc(funcName) {
    if (isNewCalculation) {
        expression = "";
        isNewCalculation = false;
    }
    expression += funcName + "(";
    updateDisplay();
}

/**
 * 鍵入上次的計算結果常數 Ans
 */
function inputAns() {
    if (isNewCalculation) {
        expression = "";
        isNewCalculation = false;
    }
    expression += "Ans";
    updateDisplay();
}

/**
 * 刪除最後一個字元 (退格)
 */
function deleteChar() {
    if (isNewCalculation) {
        expression = "";
        isNewCalculation = false;
        updateDisplay();
        return;
    }
    
    if (expression.length > 0) {
        // 如果結尾是 Ans，直接刪除整個單字
        if (expression.endsWith("Ans")) {
            expression = expression.slice(0, -3);
        } else {
            expression = expression.slice(0, -1);
        }
    }
    updateDisplay();
}

/**
 * 清除所有輸入與顯示 (AC)
 */
function clearAll() {
    expression = "";
    isNewCalculation = false;
    updateDisplay();
    // 確保結果顯示重置為 0，且移除非預覽樣式
    document.getElementById("result-display").textContent = "0";
    document.getElementById("result-display").classList.remove("preview");
}

/**
 * 切換角度模式 (DEG/RAD)
 */
function toggleAngleMode() {
    isDegreeMode = !isDegreeMode;
    document.getElementById("indicator-mode").textContent = isDegreeMode ? "DEG" : "RAD";
    updateDisplay();
}

/**
 * 更新記憶體狀態燈
 */
function updateMemoryIndicator() {
    const memBadge = document.getElementById("indicator-memory");
    if (memory !== 0) {
        memBadge.classList.remove("hidden");
    } else {
        memBadge.classList.add("hidden");
    }
}

/**
 * 獲取當前運算式求值結果（用於記憶體操作等）
 * @returns {number}
 */
function evaluateCurrentExpression() {
    if (!expression) return 0;
    let evalExpr = expression;
    const openParens = (evalExpr.match(/\(/g) || []).length;
    const closeParens = (evalExpr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
        evalExpr += ")".repeat(openParens - closeParens);
    }
    const tokens = tokenize(evalExpr);
    const ast = parse(tokens);
    return evaluateAST(ast, isDegreeMode);
}

// 記憶體清空 (MC)
function memClear() {
    memory = 0;
    updateMemoryIndicator();
}

// 記憶體召回 (MR)
function memRecall() {
    if (isNewCalculation) {
        expression = "";
        isNewCalculation = false;
    }
    expression += memory.toString();
    updateDisplay();
}

// 記憶體累加 (M+)
function memAdd() {
    try {
        const val = evaluateCurrentExpression();
        memory += val;
        updateMemoryIndicator();
    } catch (e) {
        showError(e.message);
    }
}

// 記憶體累減 (M-)
function memSub() {
    try {
        const val = evaluateCurrentExpression();
        memory -= val;
        updateMemoryIndicator();
    } catch (e) {
        showError(e.message);
    }
}

// 記憶體儲存 (MS)
function memStore() {
    try {
        const val = evaluateCurrentExpression();
        memory = val;
        updateMemoryIndicator();
    } catch (e) {
        showError(e.message);
    }
}

/**
 * 顯示計算出錯
 * @param {string} msg 錯誤訊息
 */
function showError(msg) {
    const resultDisplay = document.getElementById("result-display");
    resultDisplay.textContent = msg;
    resultDisplay.classList.remove("preview");
    isNewCalculation = true;
}

/**
 * 按下 '=' 鍵：計算最終結果並固化顯示
 */
function calculateResult() {
    if (!expression) return;
    try {
        let finalExpr = expression;
        // 自動補足缺少的右括號
        const openParens = (finalExpr.match(/\(/g) || []).length;
        const closeParens = (finalExpr.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            finalExpr += ")".repeat(openParens - closeParens);
        }

        const tokens = tokenize(finalExpr);
        const ast = parse(tokens);
        const val = evaluateAST(ast, isDegreeMode);

        // 儲存至 Ans
        lastAnswer = val;

        // 固化結果顯示 (移除 preview 半透明類別)
        const resultDisplay = document.getElementById("result-display");
        resultDisplay.textContent = formatResult(val);
        resultDisplay.classList.remove("preview");

        // 頂部公式欄更新為完整算式 (包含等號)
        document.getElementById("expression-display").textContent = finalExpr + " =";
        
        // 使用者下次可以直接利用此結果繼續運算
        expression = val.toString();
        isNewCalculation = true;
    } catch (err) {
        showError(err.message);
    }
}

/**
 * 行動版鍵盤面板切換 (Basic / Scientific)
 * @param {string} panel 面板代號 'basic' | 'scientific'
 */
function switchKeypad(panel) {
    const tabBasic = document.getElementById("tab-basic");
    const tabSci = document.getElementById("tab-scientific");
    const panelBasic = document.getElementById("panel-basic");
    const panelSci = document.getElementById("panel-scientific");

    if (panel === "basic") {
        tabBasic.classList.add("active");
        tabSci.classList.remove("active");
        panelBasic.classList.remove("hidden-mobile");
        panelSci.classList.add("hidden-mobile");
    } else {
        tabSci.classList.add("active");
        tabBasic.classList.remove("active");
        panelSci.classList.remove("hidden-mobile");
        panelBasic.classList.add("hidden-mobile");
    }
}

/**
 * 鍵盤輸入事件對應 (支援電腦實體鍵盤操作)
 * @param {KeyboardEvent} e
 */
function handleKeyboardInput(e) {
    // 阻斷預設行為以防影響頁面滾動 (例如 Backspace 退回上一頁)
    if (e.key === "Backspace" || e.key === "/") {
        e.preventDefault();
    }

    const key = e.key;

    // 1. 數字鍵
    if (/[0-9]/.test(key)) {
        inputChar(key);
    }
    // 2. 小數點
    else if (key === ".") {
        inputChar(".");
    }
    // 3. 四則運算子
    else if (key === "+") {
        inputChar("+");
    } else if (key === "-") {
        inputChar("-");
    } else if (key === "*") {
        inputChar("×");
    } else if (key === "/") {
        inputChar("÷");
    } else if (key === "%") {
        inputChar("%");
    } else if (key === "^") {
        inputChar("^");
    }
    // 4. 括號與階乘
    else if (key === "(") {
        inputChar("(");
    } else if (key === ")") {
        inputChar(")");
    } else if (key === "!") {
        inputChar("!");
    }
    // 5. 控制鍵
    else if (key === "Enter" || key === "=") {
        calculateResult();
    } else if (key === "Backspace") {
        deleteChar();
    } else if (key === "Escape") {
        clearAll();
    }
    // 6. 快捷科學函數映射 (s -> sin, c -> cos, t -> tan, q -> sqrt, p -> pi)
    else if (key.toLowerCase() === "s") {
        inputFunc("sin");
    } else if (key.toLowerCase() === "c") {
        inputFunc("cos");
    } else if (key.toLowerCase() === "t") {
        inputFunc("tan");
    } else if (key.toLowerCase() === "q") {
        inputFunc("√");
    } else if (key.toLowerCase() === "p") {
        inputChar("π");
    } else if (key.toLowerCase() === "e") {
        inputChar("e");
    }
}

/* ==========================================================================
   表達式解析模組 - Lexer / Tokenizer (詞法分析)
   ========================================================================== */

/**
 * 將使用者輸入的數學算式字串切分為 Token 陣列
 * @param {string} input 數學公式字串
 * @returns {Array} Token 陣列
 */
function tokenize(input) {
    let pos = 0;
    const tokens = [];

    // 正則表達式設計
    const numRegex = /^([0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/;
    const wordRegex = /^(sin|cos|tan|asin|acos|atan|ln|log|abs|pi|π|e|ans)/i;

    while (pos < input.length) {
        let char = input[pos];

        // 跳過空白字元
        if (/\s/.test(char)) {
            pos++;
            continue;
        }

        // 1. 匹配數字 (支援 1.23E+5, .5 等格式)
        let match = input.substring(pos).match(numRegex);
        if (match) {
            let numStr = match[0];
            tokens.push({ type: "NUMBER", value: parseFloat(numStr) });
            pos += numStr.length;
            continue;
        }

        // 2. 匹配科學函數與數學常數
        match = input.substring(pos).match(wordRegex);
        if (match) {
            let word = match[0].toLowerCase();
            if (word === "pi" || word === "π") {
                tokens.push({ type: "CONSTANT", value: Math.PI, name: "π" });
            } else if (word === "e") {
                tokens.push({ type: "CONSTANT", value: Math.E, name: "e" });
            } else if (word === "ans") {
                tokens.push({ type: "CONSTANT", value: lastAnswer, name: "Ans" });
            } else {
                tokens.push({ type: "FUNCTION", value: word });
            }
            pos += match[0].length;
            continue;
        }

        // 3. 匹配運算子與符號
        if (char === "+") {
            tokens.push({ type: "PLUS", value: "+" });
        } else if (char === "-") {
            tokens.push({ type: "MINUS", value: "-" });
        } else if (char === "*" || char === "×") {
            tokens.push({ type: "MUL", value: "*" });
        } else if (char === "/" || char === "÷") {
            tokens.push({ type: "DIV", value: "/" });
        } else if (char === "%") {
            tokens.push({ type: "MOD", value: "%" });
        } else if (char === "^") {
            tokens.push({ type: "POW", value: "^" });
        } else if (char === "(") {
            tokens.push({ type: "LPAREN", value: "(" });
        } else if (char === ")") {
            tokens.push({ type: "RPAREN", value: ")" });
        } else if (char === "!") {
            tokens.push({ type: "EXCL", value: "!" });
        } else if (char === "√") {
            tokens.push({ type: "FUNCTION", value: "sqrt" });
        } else {
            throw new Error("Invalid Char");
        }
        pos++;
    }

    // 4. 自動插入隱式乘法運算子
    // 例如： 2π -> 2 * π, 5(3+1) -> 5 * (3+1), (1+2)sin(3) -> (1+2) * sin(3)
    const processedTokens = [];
    for (let i = 0; i < tokens.length; i++) {
        if (i > 0) {
            const prev = processedTokens[processedTokens.length - 1];
            const curr = tokens[i];

            // 若前一個 Token 是數值、常數、右括號或階乘，且當前 Token 是數值、常數、左括號或函數，則插入乘號
            const prevIsOperand = ["NUMBER", "CONSTANT", "RPAREN", "EXCL"].includes(prev.type);
            const currIsOperandOrFunc = ["NUMBER", "CONSTANT", "LPAREN", "FUNCTION"].includes(curr.type);

            if (prevIsOperand && currIsOperandOrFunc) {
                processedTokens.push({ type: "MUL", value: "*" });
            }
        }
        processedTokens.push(tokens[i]);
    }

    processedTokens.push({ type: "EOF", value: "" });
    return processedTokens;
}

/* ==========================================================================
   表達式解析模組 - Parser (語法分析與遞迴下降解析器)
   ========================================================================== */

/**
 * 將 Token 陣列解析成抽象語法樹 (AST)
 * @param {Array} tokens Token 陣列
 * @returns {Object} AST 根節點
 */
function parse(tokens) {
    let current = 0;

    function peek() {
        return tokens[current];
    }

    function previous() {
        return tokens[current - 1];
    }

    function isAtEnd() {
        return peek().type === "EOF";
    }

    function check(type) {
        if (isAtEnd()) return false;
        return peek().type === type;
    }

    function advance() {
        if (!isAtEnd()) current++;
        return previous();
    }

    function match(...types) {
        for (let type of types) {
            if (check(type)) {
                advance();
                return true;
            }
        }
        return false;
    }

    function consume(type, message) {
        if (check(type)) return advance();
        throw new Error(message);
    }

    // 遞迴下降解析層級：
    // 1. Expression (加減)
    // 2. Term (乘除、取模)
    // 3. Power (次方 - 右結合)
    // 4. Factor (階乘 - 後置單目)
    // 5. Primary (括號、函數、數值、常數、前置單目正負號)

    // 解析加減運算
    function parseExpression() {
        let node = parseTerm();
        while (match("PLUS", "MINUS")) {
            let op = previous();
            let right = parseTerm();
            node = { type: "BINARY", op: op.value, left: node, right: right };
        }
        return node;
    }

    // 解析乘除與餘數運算
    function parseTerm() {
        let node = parsePower();
        while (match("MUL", "DIV", "MOD")) {
            let op = previous();
            let right = parsePower();
            node = { type: "BINARY", op: op.value, left: node, right: right };
        }
        return node;
    }

    // 解析次方運算 (右結合，如 2^3^2 為 2^(3^2))
    function parsePower() {
        let node = parseFactor();
        if (match("POW")) {
            let op = previous();
            let right = parsePower(); // 遞迴呼叫 parsePower 實現右結合
            node = { type: "BINARY", op: "^", left: node, right: right };
        }
        return node;
    }

    // 解析後置單目運算子 (階乘 !)
    function parseFactor() {
        let node = parsePrimary();
        while (match("EXCL")) {
            node = { type: "UNARY_POSTFIX", op: "!", argument: node };
        }
        return node;
    }

    // 解析基礎單元 (數字、常數、正負號、小括號、函數)
    function parsePrimary() {
        if (match("MINUS")) {
            let right = parsePrimary();
            return { type: "UNARY_PREFIX", op: "-", argument: right };
        }
        if (match("PLUS")) {
            return parsePrimary();
        }
        if (match("NUMBER", "CONSTANT")) {
            let tok = previous();
            return { type: "LITERAL", value: tok.value };
        }
        if (match("FUNCTION")) {
            let funcToken = previous();
            let arg;
            // 支援 sin(30) 與簡寫 sin 30 兩種格式
            if (match("LPAREN")) {
                arg = parseExpression();
                consume("RPAREN", "Unmatched Paren");
            } else {
                arg = parsePrimary();
            }
            return { type: "CALL", name: funcToken.value, argument: arg };
        }
        if (match("LPAREN")) {
            let expr = parseExpression();
            consume("RPAREN", "Unmatched Paren");
            return expr;
        }

        throw new Error("Syntax Error");
    }

    // 開始解析並確保 Token 完全消耗完畢
    const ast = parseExpression();
    if (!isAtEnd()) {
        throw new Error("Syntax Error");
    }
    return ast;
}

/* ==========================================================================
   表達式求值模組 - AST Evaluator (語法樹求值)
   ========================================================================== */

/**
 * 遍歷並計算 AST 的結果
 * @param {Object} node AST 節點
 * @param {boolean} degMode 是否為角度模式
 * @returns {number} 計算值
 */
function evaluateAST(node, degMode) {
    if (node.type === "LITERAL") {
        return node.value;
    }
    if (node.type === "UNARY_PREFIX") {
        let val = evaluateAST(node.argument, degMode);
        if (node.op === "-") return -val;
        return val;
    }
    if (node.type === "UNARY_POSTFIX") {
        let val = evaluateAST(node.argument, degMode);
        if (node.op === "!") {
            return factorial(val);
        }
        return val;
    }
    if (node.type === "BINARY") {
        let leftVal = evaluateAST(node.left, degMode);
        let rightVal = evaluateAST(node.right, degMode);
        switch (node.op) {
            case "+": return leftVal + rightVal;
            case "-": return leftVal - rightVal;
            case "*": return leftVal * rightVal;
            case "/":
                if (rightVal === 0) throw new Error("Divide by Zero");
                return leftVal / rightVal;
            case "%":
                if (rightVal === 0) throw new Error("Divide by Zero");
                return leftVal % rightVal;
            case "^":
                return Math.pow(leftVal, rightVal);
            default:
                throw new Error("Invalid Op");
        }
    }
    if (node.type === "CALL") {
        let argVal = evaluateAST(node.argument, degMode);
        switch (node.name) {
            case "sin":
                return Math.sin(degMode ? toRadians(argVal) : argVal);
            case "cos":
                return Math.cos(degMode ? toRadians(argVal) : argVal);
            case "tan":
                // 處理 tan(90) 等無定義極限值
                if (degMode && Math.abs(argVal % 180) === 90) throw new Error("Domain Error");
                return Math.tan(degMode ? toRadians(argVal) : argVal);
            case "asin":
                if (argVal < -1 || argVal > 1) throw new Error("Domain Error");
                let valAsin = Math.asin(argVal);
                return degMode ? toDegrees(valAsin) : valAsin;
            case "acos":
                if (argVal < -1 || argVal > 1) throw new Error("Domain Error");
                let valAcos = Math.acos(argVal);
                return degMode ? toDegrees(valAcos) : valAcos;
            case "atan":
                let valAtan = Math.atan(argVal);
                return degMode ? toDegrees(valAtan) : valAtan;
            case "sqrt":
                if (argVal < 0) throw new Error("Domain Error");
                return Math.sqrt(argVal);
            case "ln":
                if (argVal <= 0) throw new Error("Domain Error");
                return Math.log(argVal);
            case "log":
                if (argVal <= 0) throw new Error("Domain Error");
                return Math.log10(argVal);
            case "abs":
                return Math.abs(argVal);
            case "1/":
                if (argVal === 0) throw new Error("Divide by Zero");
                return 1 / argVal;
            default:
                throw new Error("Invalid Func");
        }
    }
    throw new Error("Invalid AST");
}

/* ==========================================================================
   輔助運算函數 (Helper Math Functions)
   ========================================================================== */

// 角度轉弧度
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// 弧度轉角度
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// 遞迴計算階乘 (支援到 170 階，超出 JS 安全上限將傳回溢位錯誤)
function factorial(n) {
    if (n < 0) throw new Error("Domain Error");
    if (!Number.isInteger(n)) throw new Error("Domain Error"); // 階乘僅支援整數
    if (n > 170) throw new Error("Overflow");
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
