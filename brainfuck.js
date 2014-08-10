var brainfuck = {
  OPCODE: {NEXT: 0x01, ADD: 0x02, OUTPUT: 0x04, INPUT: 0x08, LOOP_S: 0x10, LOOP_E: 0x11},
  runOrig: function(source, jqTextHandler) {
    var length = source.length;
    var memory = new Array(65535);
    for (var i = 0; i < memory.length; i++) {
      memory[i] = 0;
    }
    var output = '';
    var dc = 0;
    var pc = 0;
    while (pc < length) {
      var cmd = source[pc];
      switch (cmd) {
        case '+':
          memory[dc] += 1;
          break;
        case '-':
          memory[dc] -= 1;
          break;
        case '>':
          dc += 1;
          break;
        case '<':
          dc -= 1;
          break;
        case '.':
          var c = String.fromCharCode(memory[dc]);
          output += c;
          if (c === "\n") {
            jqTextHandler.val(jqTextHandler.val() + output);
            output = '';
          }
          break;
        case ',':
          // TODO
          break;
        case '[':
          pc += 1;
          if (memory[dc] != 0) continue;
          var localDepth = 0;
          while (localDepth > 0 || source[pc] !== ']') {
            if (source[pc] === '[') {
              localDepth += 1;
            } else if (source[pc] === ']') {
              localDepth -= 1;
            }
            pc += 1;
          }
          break;
        case ']':
          pc -= 1;
          var localDepth = 0;
          while (localDepth > 0 || source[pc] !== '[') {
            if (source[pc] === ']') {
              localDepth += 1;
            } else if (source[pc] === '[') {
              localDepth -= 1;
            }
            pc -= 1;
          }
          pc -= 1;
          break;
      }
      pc += 1;
    }
    jqTextHandler.val(jqTextHandler.val() + output);
  },
  execute: function(program, jumpTable, jqTextHandler) {
    var len = program.length;
    var memory = new Array(65535);
    for (var i = 0; i < memory.length; i++) {
      memory[i] = 0;
    }
    var output = '';
    var dc = 0;
    var pc = 0;
    while (pc < len) {
      switch (program[pc]) {
        case this.OPCODE.NEXT:
          pc++;
          dc += program[pc];
          break;
        case this.OPCODE.ADD:
          pc++;
          memory[dc] += program[pc];
          break;
        case this.OPCODE.OUTPUT:
          var c = String.fromCharCode(memory[dc]);
          output += c;
          if (c === "\n") {
            jqTextHandler.val(jqTextHandler.val() + output);
            output = '';
          }
          break;
        case this.OPCODE.INPUT:
          // TODO
          break;
        case this.OPCODE.LOOP_S:
          if (memory[dc] == 0) {
            pc = jumpTable[pc];
          }
          break;
        case this.OPCODE.LOOP_E:
          pc = jumpTable[pc] - 1;
          break;
      }
      pc++;
    }
    jqTextHandler.val(jqTextHandler.val() + output);
  },
  compile: function(source) {
    var program = [];
    var jumpTable = [];
    var stack = [];
    var stackIdx = 0;
    var pc = 0;
    var len = source.length;

    while (pc < len) {
      var c = source[pc];
      switch (c) {
        case '>':
        case '<':
        case '+':
        case '-':
          var cnt = 0;
          while (source[pc] == c) {
            cnt++;
            pc++;
          }
          program[program.length] = (c === '>' || c === '<' ? this.OPCODE.NEXT : this.OPCODE.ADD);
          program[program.length] = (c === '>' || c === '+' ? cnt : -cnt);
          break;
        case '.':
          program[program.length] = this.OPCODE.OUTPUT;
          pc++;
          break;
        case ',':
          program[program.length] = this.OPCODE.INPUT;
          pc++;
          break;
        case '[':
          stack[stackIdx] = program.length;
          stackIdx++;
          program[program.length] = this.OPCODE.LOOP_S;
          pc++;
          break;
        case ']':
          stackIdx--;
          jumpTable[stack[stackIdx]] = program.length;
          jumpTable[program.length] = stack[stackIdx];
          program[program.length] = this.OPCODE.LOOP_E;
          pc++;
          break;
        default:
          pc++;
      }
    }
    return {program: program, jumpTable: jumpTable};
  },
  translate: function(source, indentStr) {
    indentStr = indentStr || '  ';
    function makeIndent(indentStr, n) {
      var nIndentStr = ''
      for (var i = 0; i < n; i++) {
        nIndentStr += indentStr
      }
      return nIndentStr;
    };
    var output = "#include <stdio.h>\n"
        + "#include <stdlib.h>\n\n"
        + "#define MEMORY_SIZE 65536\n\n"
        + "int main(void)\n"
        + "{\n"
        + indentStr + "static char memory[MEMORY_SIZE];\n"
        + indentStr + "char *ptr = memory;\n\n";
    var depth = 1;
    var pc = 0;
    var len = source.length;
    while (pc < len) {
      switch (source[pc]) {
        case '>':
        case '<':
        case '+':
        case '-':
          var c = source[pc];
          var cnt = 0;
          while (source[pc] == c) {
            cnt++;
            pc++;
          }
          output += makeIndent(indentStr, depth);
          output += (c === '>' || c === '<' ? 'ptr' : '(*ptr)');
          if (cnt == 1) {
            output += (c === '>' || c === '+' ? "++;\n" : "--;\n");
          } else {
            output += (c === '>' || c === '+' ? ' += ' : ' -= ') + cnt + ";\n";
          }
          break;
        case '.':
          output += makeIndent(indentStr, depth) + "putchar(*ptr);\n";
          pc++;
          break;
        case ',':
          output += makeIndent(indentStr, depth) + "*ptr = getchar();\n";
          pc++;
          break;
        case '[':
          output += makeIndent(indentStr, depth) + "while (*ptr) {\n";
          depth++;
          pc++;
          break;
        case ']':
          depth--;
          output += makeIndent(indentStr, depth) + "}\n";
          pc++;
          break;
        default:
          pc++;
      }
    }
    output += "\n" + indentStr + "return EXIT_SUCCESS;\n}\n";
    return output;
  }
};
