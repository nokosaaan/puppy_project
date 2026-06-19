// CodeMirrorエディタの初期化
const editor = CodeMirror(document.getElementById('editor'), {
    value: `Circle(200, 100, { radius: 20, color: "red" });
Circle(250, 100, { radius: 20, color: "orange" });
Circle(300, 100, { radius: 20, color: "yellow" });
Circle(350, 100, { radius: 20, color: "green" });
Circle(400, 100, { radius: 20, color: "blue" });
createDominos(12,100,100,35);
startDomino();
`,
    mode: 'javascript',
    lineNumbers: true,
    theme: 'default',
    indentUnit: 2,
});

// サンプルプログラムの定義
const samplePrograms = {
  domino: {
    mode: "step",
    code: `// ドミノ倒しのサンプル
createDominos(12, 100, 50, 35);
startDomino();`
  },
  circles: {
    mode: "safeEval",
    code: `// 色付き円のサンプル
let r = 20;
Circle(200, 100, { radius: r, color: "red" });
Circle(250, 100, { radius: r, color: "orange" });
Circle(300, 100, { radius: r+5, color: "yellow" });
Circle(350, 100, { radius: r+10, color: "green" });
Circle(400, 100, { radius: r+15, color: "blue" });`
  },
  stepCircle: {
    mode: "step",
    code: `Circle(200, 100, { radius: 20, color: "red" });
Circle(250, 100, { radius: 20, color: "orange" });
Circle(300, 100, { radius: 20, color: "yellow" });
Circle(350, 100, { radius: 20, color: "green" });
Circle(400, 100, { radius: 20, color: "blue" });`
  }
};

// 実行モードを記録
let currentRunMode = "runCodeInSteps";

// サンプル選択の処理
document.getElementById('sampleSelector').addEventListener('change', function(e) {
    const selectedSample = e.target.value;
    const sample = samplePrograms[selectedSample];
    if (sample) {
        editor.setValue(sample.code);
        currentRunMode = sample.mode || "runCodeInSteps";
    }
    /*
    if (selectedSample && samplePrograms[selectedSample]) {
        editor.setValue(samplePrograms[selectedSample]);
    }
        */
});

// Matter.js の初期化
const { Engine, Render, Runner, Bodies, World } = Matter;

const engine = Engine.create();
const world = engine.world;

const render = Render.create({
  canvas: document.getElementById('world'),
  engine: engine,
  options: {
    width: 600,
    height: 600,
    wireframes: false
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// 地面
const ground = Bodies.rectangle(300, 200, 600, 20, { isStatic: true });
World.add(world, ground);

// シンプルなオプション付きのCircle関数
function Circle(x, y, options = {}) {
    const radius = options.radius || 30;
    const color = options.color || 'gray';
    const restitution = options.restitution || 0.5;
  
    const body = Bodies.circle(x, y, radius, {
      restitution: restitution,
      render: {
        fillStyle: color
      }
    });
  
    World.add(world, body);
    return body;
}
//長方形  
function Rectangle(x, y, options = {}) {
    const width = options.width || 60;
    const height = options.height || 40;
    const color = options.color || 'gray';
    const restitution = options.restitution || 0.3;
  
    const body = Bodies.rectangle(x, y, width, height, {
      restitution: restitution,
      render: {
        fillStyle: color
      }
    });
  
    World.add(world, body);
    return body;
}
//ドミノ
// ドミノ本体を保存する配列
let dominos = [];

//ドミノを直線状に配置する
function createDominos(count = 10, startX = 100, startY = 200, spacing = 35) {
  dominos = []; // 前回分をリセット
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    const y = startY;

    const domino = Bodies.rectangle(x, y, 10, 60, {
      friction: 0.1,     // 摩擦を増やして安定性を向上
      density: 0.01,    // 密度を下げて軽く
      render: {
        fillStyle: 'white'
      }
    });

    dominos.push(domino);
    World.add(world, domino);
  }
}

//最初のドミノに力を加えてスタート
function startDomino() {
  if (dominos.length > 0) {
    Matter.Body.applyForce(dominos[0], dominos[0].position, {
      x: 0.05,  // 横方向の力を弱く
      y: -0.02  // 上方向の力も弱く
    });
  }
}

// 全削除（地面も含めて完全クリア）
function clearWorld() {
  World.clear(world, true);       // 全削除（true = constraintsも含め）
  engine.events = {};             // イベント初期化
}

// 実行
function resetWorld() {
  //clearWorld();
  //World.add(world, ground); 

  const code = editor.getValue();
  if (currentRunMode === "step") {
    runCodeInSteps(code);
  } else {
    safeEval(code);
  }
}



// エディタのコードを実行
function runUserCode() {
  const code = editor.getValue();
  if (currentRunMode === "step") {
    runCodeInSteps(code);
  } else {
    safeEval(code);
  }
  //safeEval(code);
  //runCodeInSteps(code);
}

function safeEval(code) {
  // 地面以外をクリア
  World.clear(world, false);
  World.add(world, ground);
    try {
      const context = {
        Circle,
        Rectangle,
        World,
        world,
        Bodies,
        console,
        createDominos,
        startDomino,
        // 必要ならMathなども加える
      };
  
      const argNames = Object.keys(context);
      const argValues = Object.values(context);
  
      // セーフなスコープ内でコードを実行
      const func = new Function(...argNames, code);
      func(...argValues);
    } catch (e) {
      console.error("安全評価中にエラー:", e);
    }
}

function runCodeInSteps(code) {
    const lines = code.split('\n');
    let currentLine = 0;
  
    // 地面以外をクリア
    World.clear(world, false);
    World.add(world, ground);
  
    const context = {
      Circle,
      Rectangle,
      World,
      world,
      Bodies,
      console,
    };
  
    const argNames = Object.keys(context);
    const argValues = Object.values(context);
  
    const interval = setInterval(() => {
        const totalLines = editor.lineCount();
        if (currentLine >= lines.length || currentLine >= totalLines) {
          clearInterval(interval);
          return;
        }
      
        // ハイライト
        editor.operation(() => {
            editor.eachLine((line) => {
              editor.removeLineClass(line, 'background', 'highlight-line');
            });
          
            const totalLines = editor.lineCount();
          
            if (currentLine < totalLines) {
              const handle = editor.getLineHandle(currentLine);
              if (handle) {
                editor.addLineClass(handle, 'background', 'highlight-line');
              }
            }
          });
          
      
        // コード実行
        try {
          const line = lines[currentLine];
          const func = new Function(...argNames, line);
          func(...argValues);
        } catch (e) {
          console.warn(`Line ${currentLine + 1} エラー: ${e.message}`);
        }
      
        currentLine++;
      }, 800);      
  }
  
  
  // Ctrl+Enterで実行
  editor.setOption("extraKeys", {
    "Ctrl-Enter": runUserCode
  });

  // DOMが読み込まれた後に実行
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("resetBtn").addEventListener("click", resetWorld);
  document.getElementById("clearBtn").addEventListener("click", clearWorld);
});

