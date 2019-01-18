# glsl-demo - webGLでGLSLを使うデモ

view demo page : https://tohfu.github.io/glsl-demo/


このデモでは、[three.js](https://threejs.org/)を使っています。

もちろん、webGLを直接書いてGLSLを適用、、という方法も取れますが、デバッグなど、three.jsを使った方が圧倒的に楽です。


## デモ01：板ポリゴンにfragment shaderで色をつけてみる

[デモページ](https://tohfu.github.io/glsl-demo/01_simple_color.html)

まずは、板ポリを作成→シェーダーを設定してみます。

#### シェーダーおさらい

- vertex shader : ポリゴンの頂点情報・頂点色を計算する役割があります。各頂点ごとに記述したシェーダーの計算が行われます。

- fragment shader : ポリゴン内のピクセル情報を計算する役割があります。各ピクセルごとにシェーダーの計算が行われます。


01_simple_color.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GLSL Sample - 01.simple color</title>
  <style type="text/css">
    html, body {
      margin: 0;
    }
    #container {
      position: fixed;
    }
  </style>
</head>

<body>
  <div id="container"></div>

  <!-- vertex shaderをここに記述 -->
  <script id="vertexShader" type="x-shader/x-vertex">
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  </script>
  <!-- /vertex shaderをここに記述 -->

  <!-- fragment shaderをここに記述 -->
  <script id="fragmentShader" type="x-shader/x-fragment">
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // ここで各ピクセルに固定の色を指定しています
    }
  </script>
  <!-- /fragment shaderをここに記述 -->

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/98/three.min.js"></script>
  <script src="./assets/js/main.js"></script>
</body>

</html>
```

main.js
```javascript
document.addEventListener('DOMContentLoaded', init);

async function init() {

  const container = document.getElementById('container');

  let camera, scene, renderer;

  // カメラを作成
  camera = new THREE.Camera();
  camera.position.z = 1;

  // シーンを作成
  scene = new THREE.Scene();

  // 板ポリゴンのメッシュをシーンに追加
  scene.add(createPlaneMesh());

  // レンダラーを作成
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // リサイズイベント
  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);

  // アニメーション
  animate();

  /**
   * 板ポリゴンを作成
   *
   * @return {Object} メッシュオブジェクト
   */
  function createPlaneMesh() {
    // 2x2の板ポリゴンを作成
    const geometry = new THREE.PlaneBufferGeometry(2, 2);

    // 板ポリに貼り付けるマテリアルを作成
    // shaderを利用するときは、ShaderMaterialを使う
    const material = new THREE.ShaderMaterial({
      vertexShader   : document.getElementById('vertexShader').textContent,  // vertex shaderの指定
      fragmentShader : document.getElementById('fragmentShader').textContent // fragment shaderの指定
    });
    material.extensions.derivatives = true;

    // メッシュを作成
    return new THREE.Mesh(geometry, material);
  }

  /**
   * 画面のリサイズ
   *
   * @param event
   */
  function onWindowResize(event) {
    // リサイズ
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  /**
   * アニメーション
   *
   * @param delta
   */
  function animate(delta) {
    requestAnimationFrame( animate );
    render(delta);
  }

  /**
   * 描画
   *
   * @param delta
   */
  function render(delta) {
    renderer.render( scene, camera );
  }

};
```

板ポリゴンを作成しで3D空間上に配置し、これをカメラで撮影したものをcanvasに描画しています。
この板ポリゴンに、カスタムシェーダーを設定します。

#### カスタムシェーダーを板ポリゴンに設定する

three.jsの基本的なところと、ポリゴンの作成についてはここでは割愛します。

カスタムシェーダーを使うにあたり、three.jsでは、`THREE.ShaderMaterial()`を指定する必要があります。

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader   : document.getElementById('vertexShader').textContent,  // vertex shaderの指定
  fragmentShader : document.getElementById('fragmentShader').textContent // fragment shaderの指定
});
```
で、htmlの方に記述した各shaderの設定をしています。

#### シェーダーの記述場所について

一般的には、html内のscriptタグ内に記述します。
javascriptとして処理されないようにするため、`<script id="vertexShader" type="x-shader/x-vertex"></script>`のようなtype指定をしています。

ですが、現実的に案件で使用する時は、html直書きだとめちゃめちゃ管理しずらいと思いますので、[Shaderファイルの管理方法 - Qiita](https://qiita.com/mczkzk/items/079c36b6ee3f0a802572) などを利用すると、別ファイル管理できます。

また、ES6で書くのであればヒアドキュメントが使えるので、

```javascript
const fshader = `
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // ここで各ピクセルに固定の色を指定しています
  }
`;
```
みたいにしちゃうのも良いのかなと思います。

#### カスタムシェーダーについて

肝心のshaderについてですが、

vertex shader
```glsl
attribute vec3 position;

void main() {
  gl_Position = vec4(position, 1.0);
}
```

fragment shader
```glsl
void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
```
としています。

vertex/fragment shaderのルールとして、それぞれ、main()関数内でGLSLの組み込み変数に、下記の値を設定する必要があります。

- vertex shader : `gl_Position`に、頂点情報を設定
- fragment shader : `gl_FragColor`に、ピクセルの色情報を設定

#### attribute変数

vertex shaderのコード中で、いきなりpositionという変数が使われていますが、これはattribute変数と呼ばれるものです。

この修飾子がついた変数は、vertex shaderに渡される、各頂点に依存する情報です。

three.jsで定義されているので、詳しくは [Built-in uniforms and attributes](https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram) などを参考にしてみてください。

上記のコードでは、

- gl_Positionにはattribute変数であるpositionをそのまま設定
- gl_FragColorにはどのピクセルであっても一律`vec4(1.0, 0.0, 1.0, 1.0)`を返している

ので、画面が単色の紫になっていると思います。

これからのデモでは、ほぼfragment shaderに手を加えていきます。
**fragment shaderのmain()内でどのようなピクセル色情報を返してあげるか**、がポイントになります。


----


## デモ02-01：板ポリゴンにテクスチャを貼り付ける

<img src="https://github.com/TOHFU/glsl-demo/blob/master/figure/figure01.png" width="320px">

[デモページ](https://tohfu.github.io/glsl-demo/02_01_simple_texture.html)

次に、この板ポリゴンにテクスチャを貼り付けてみます。

#### テクスチャ画像を読み込む

先ほどのjsに、テクスチャ画像の読み込みを追加します。
この実装は、three.jsの画像ローダーに頼ります。

```javascript
let texture;

// テクスチャの読み込み
await loadTexture('./assets/img/lena_std.jpg');

// ... カメラの作成など、テクスチャ読み込み後の処理

/**
  * テクスチャの読み込み
  *
  * @param {string} imagePath 画像のパス
  */
function loadTexture(imagePath) {
  return new Promise(resolve => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(imagePath, (tex) => {
        texture = tex;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        resolve();
    });
  });
}
```

ここで読み込んだ`texture`を、なんとかしてshaderに渡す必要があります。

#### uniform変数 (jsからGLSLへの値の受け渡し)

js側からGLSLに汎用的なデータを渡すには、uniform変数という仕組みを使います。

```javascript
let uniforms;

function createPlaneMesh() {
  ...

  // uniform変数を定義
  // ここで定義した変数が、shader内で利用できます
  uniforms = {
    u_tex : { type : "t",  value : texture } // テクスチャ
  };

  const material = new THREE.ShaderMaterial({
    uniforms       : uniforms, // Maretialの定義時に、必要なuniformを詰めたオブジェクトを指定する
    vertexShader   : document.getElementById('vertexShader').textContent,
    fragmentShader : document.getElementById('fragmentShader').textContent
  });

  ...
}
```

ちなみに、typeはGLSL側で受け取る型を指定します。

| 値 | 型 |
|:---|:---|
| i | int |
| f | float |
| v2 | THREE.Vector2(2次元ベクトル) |
| v3 | THREE.Vector3(3次元ベクトル) |
| v4 | THREE.Vector4(4次元ベクトル) |
| t | THREE.Texture(テクスチャ情報) |

がよく使われるものです。
ここで指定した値を、後述するshaderで受け取ります。

#### カスタムシェーダーについて

vertex shader
```glsl
varying vec2 vUv; // fragment shaderに渡すための変数を定義

void main() {
  vUv = uv; // 頂点ごとのuv座標をそのまま設定
  gl_Position = vec4(position, 1.0);
}
```

fragment shader
```glsl
varying vec2 vUv;          // テクスチャ座標(vertex shaderから)

uniform sampler2D u_tex;   // テクスチャ

void main() {
  gl_FragColor = texture2D(u_tex, vUv);
}
```


`uniform sampler2D u_tex;` のように、uniform変数を宣言することで、先述の値を受け取っています。

#### varyng変数について

また、vertex/fragment shader両方に、
```glsl
varying vec2 vUv;
```
の宣言が増えました。これはvarying変数といい、vertex shader -> fragment shaderの間で値を渡したいときに使用する変数です。

ここでは、attribute変数であるuv(頂点位置に対応するテクスチャ画像の座標)を、vUvというvarying変数にそのまま代入して、fragment shaderに渡しています。

#### テクスチャの表示

fragment shader側では、上記の座標データ(vUv)と、テクスチャデータ(u_tex)をもとに、どの座標のピクセル色情報をgl_FragColorに設定するか決めています。

このマッピングは、texture2D(texture, uv)という関数が用意されています。

。。。と、なんかここまでひたすらお作法ですね。

いきなり出てくる変数が多いので、これを知っておかないと、GLSLわかりにくいーってなると思います。


----


## デモ02-02：テクスチャの画角を固定する(background-size: cover相当に)

<img src="https://github.com/TOHFU/glsl-demo/blob/master/figure/figure02.png" width="320px">

[デモページ](https://tohfu.github.io/glsl-demo/02_02_simple_texture_scaled.html)

先ほどの[デモ02-01](https://tohfu.github.io/glsl-demo/02_01_simple_texture.html)では、ウインドウサイズを変更した時に、テクスチャの画角が変わってしまいました。

サイズ固定のcanvasで使うときは問題ないですが、もう少し実用的に使えるように改善してみます。

main.js
```javascript
// リサイズイベント
onWindowResize();
window.addEventListener('resize', onWindowResize, false);

...

// uniform変数を定義
// ここで定義した変数が、shader内で利用できます
uniforms = {
  u_resolution : { type : "v2", value : new THREE.Vector2() },        // 追記：画面の解像度
  u_tex        : { type : "t",  value : texture },
  u_texsize    : { type : "v2", value : new THREE.Vector2(texture.image.width, texture.image.height)}, // 追記：テクスチャのサイズ
};

...

/**
 * 画面のリサイズ
 *
 * @param event
 */
function onWindowResize(event) {
  // リサイズ
  renderer.setSize( window.innerWidth, window.innerHeight );
  // uniform変数の位置情報を更新
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}
```

uniforms変数を使って、"v2"(2次元ベクトル)の形式で画面のサイズ、テクスチャのサイズを送信します。

また、shaderは下記の通りです。


vertex shader
```glsl
デモ02_01と同じなので省略
```

fragment shader
```glsl
varying vec2 vUv;          // テクスチャ座標(vertex shaderから)

uniform vec2 u_resolution; // 画面の解像度
uniform sampler2D u_tex;   // テクスチャ
uniform vec2 u_texsize;    // テクスチャのサイズ

/**
 * vUvのテクスチャ座標をリサイズ(cover相当)に変換
 *
 * @param (res_size) 画面のサイズ
 * @param (tex_size) テクスチャのサイズ
 * @param vUvをリサイズした座標
 */
vec2 coverd_texture(vec2 res_size, vec2 tex_size) {

  float aspect_tex = tex_size.x / tex_size.y; // テクスチャのアスペクト比
  float aspect_res = res_size.x / res_size.y; // 画面領域のアスペクト比
  float ratio = aspect_res / aspect_tex;      // アスペクト比の比率

  vec2 aspect = vec2( // 拡大率の計算(ここをmaxにしたらcontainっぽくなりますね)
    min(ratio, 1.0),
    min(1.0/ratio, 1.0)
  );

  return vec2( // リサイズ＋センタリング
    vUv.x * aspect.x + (1.0 - aspect.x) * 0.5,
    vUv.y * aspect.y + (1.0 - aspect.y) * 0.5
  );

}

void main() {

  // リサイズ
  vec2 uv = coverd_texture(u_resolution, u_texsize);

  gl_FragColor = texture2D(u_tex, uv);
}
```

### GLSLのベクトル型について

```glsl
float aspect_tex = tex_size.x / tex_size.y; // テクスチャのアスペクト比
float aspect_res = res_size.x / res_size.y; // 画面領域のアスペクト比
```
vec2(2次元ベクトル)の各要素に、いきなりx,yという値で参照しています。

GLSLの特性として、ベクトル型(vec2, vec3, vec4)の各要素にアクセスするための値が用意されています。

基本的には、
- `.x .y .z .w` ：座標情報を扱う変数の時に使用
- `.r .g .b .a` ：色情報を扱う変数の時に使用
- `.s .t .p .q` ：テクスチャ空間座標の時に使用

が使用できます。

```glsl
vec4 vector;
vector[0] = vector.r = vector.x = vector.s;
vector[1] = vector.g = vector.y = vector.t;
vector[2] = vector.b = vector.z = vector.p;
vector[3] = vector.a = vector.w = vector.q;
```
みたいな感じで、基本的にどの値を使ってもOKです。コードの可読性を意識して使い分けることができます。

以上の処理で、アスペクト比を固定した上でテクスチャの拡大/縮小ができるようになりました。

----

## デモ03-01：時間を使ったエフェクト

<img src="https://github.com/TOHFU/glsl-demo/blob/master/figure/figure03.png" width="320px">

[デモページ](https://tohfu.github.io/glsl-demo/03_01_effect_by_time_rgb_shifter.html)

今までのデモをもとに、実際にアニメーションするエフェクトを作成してみたいと思います。

時系列で変化するようなエフェクトをつくときは、glsl自体で時間情報を取得することはできないので、jsから値を送信する必要があります。

jsから値を送信する...そう！これもuniform変数を使います。

この値をもとに、エフェクトの変化量を計算する、という流れになります。

main.js
```javascript

// uniform変数を定義
// ここで定義した変数が、shader内で利用できます
uniforms = {
  u_time       : { type : "f" , value : 0.0 }, // 追加：時間
  u_resolution : { type : "v2", value : new THREE.Vector2() },
  u_tex        : { type : "t",  value : texture },
  u_texsize    : { type : "v2", value : new THREE.Vector2(texture.image.width, texture.image.height)}
};

...

/**
 * 描画
 */
function render(delta) {
  uniforms.u_time.value = delta;  // ここで経過時間をuniform変数に指定
  renderer.render( scene, camera );
}
```

vertex shader
```glsl
デモ02_01と同じなので省略
```

fragment shader
```glsl
varying vec2 vUv;          // テクスチャ座標(vertex shaderから)

uniform float u_time;      // 時間
uniform vec2 u_resolution; // 画面の解像度
uniform sampler2D u_tex;   // テクスチャ
uniform vec2 u_texsize;    // テクスチャのサイズ

/**
 * vUvのテクスチャ座標をリサイズ(cover相当)に変換
 */
vec2 coverd_texture(vec2 res_size, vec2 tex_size) {
  // デモ02-02と同じなので省略
}

void main() {

  // リサイズ
  vec2 uv = coverd_texture(u_resolution, u_texsize);

  // 0.0~1.0間のノコギリ波を生成
  // https://qiita.com/edo_m18/items/71f6064f3355be7e4f45
  float t = mod(u_time / 1000.0, 1.0);

  // RGBのx軸ずれを定義
  vec3 diff = vec3(0.03 * t, -0.003 * t, -0.045 * t);

  // RGBごとにuv座標からずれた点を参照する
  gl_FragColor = vec4(
    texture2D(u_tex, uv + vec2(diff.r, 0.0)).r,
    texture2D(u_tex, uv + vec2(diff.g, 0.0)).g,
    texture2D(u_tex, uv + vec2(diff.b, 0.0)).b,
    1.0
  );
}
```

texture2DはR, G, B, Aの情報を持った4次元ベクトルです。
このベクトルからそれぞれの色情報を取り出し、少しずらした座標を参照することで、色収差(色ずれ)の効果を再現することができます。

```glsl
// RGBごとにuv座標からずれた点を参照する
gl_FragColor = vec4(
  texture2D(u_tex, uv + vec2(diff.r, 0.0)).r,
  texture2D(u_tex, uv + vec2(diff.g, 0.0)).g,
  texture2D(u_tex, uv + vec2(diff.b, 0.0)).b,
  1.0
);
```
でRGBごとに、テクスチャの、どの座標を参照するか決めています。

この`diff`がずれ情報(RGBごとに設定するため、3次元ベクトルとして定義)となり、

```
// RGBのx軸ずれを定義
vec3 diff = vec3(0.03 * t, -0.003 * t, -0.045 * t);
```

としています。

また、uniform変数で送られる値はページを開いてからの描画時間を送信しているので、0.0〜1.0間の変化量として扱います。

```glsl
// 0.0~1.0間のノコギリ波を生成
float t = mod(u_time / 1000.0, 1.0);
```

ここで、0.0~1.0までの変化の度合い(いわゆるイージング)を設定しています。
[glsl-easings](https://github.com/glslify/glsl-easings)などを参考にすると、わかりやすいと思います。

----


## デモ03-02：マウスによるインタラクション

<img src="https://github.com/TOHFU/glsl-demo/blob/master/figure/figure04.png" width="320px">

[デモページ](https://tohfu.github.io/glsl-demo/03_02_effect_by_mouse_interaction.html)

最後に、インタラクション要素のあるエフェクトを作ってみます。
基本的に要領は一緒で、uniform変数を使ってマウス座標を2次元ベクトル形式で送信します。

main.js
```javascript

...

// uniform変数を定義
// ここで定義した変数が、shader内で利用できます
uniforms = {
  u_resolution : { type : "v2", value : new THREE.Vector2() },
  u_tex        : { type : "t",  value : texture },
  u_texsize    : { type : "v2", value : new THREE.Vector2(texture.image.width, texture.image.height)},
  u_mouse      : { type : "v2", value : new THREE.Vector2() } // 追加：マウス座標
};

...

// マウス移動イベント
if (window.PointerEvent) {
  document.addEventListener('pointermove', onPointerMove, true);
} else {
  document.addEventListener('touchmove', onPointerMove, true);
  document.addEventListener('mousemove', onPointerMove, true);
}

...

/**
 * マウスポインタ一の取得(画面左下が原点)
 *
 * @param event
 */
function onPointerMove(event) {
  // uniform変数のマウスポインタ情報を更新
  const ratio = window.innerHeight / window.innerWidth;
  uniforms.u_mouse.value.x = (event.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
  uniforms.u_mouse.value.y = (event.pageY - window.innerHeight / 2) / window.innerHeight * -1;
}

```

vertex shader
```glsl
デモ02_01と同じなので省略
```

fragment shader
```glsl
varying vec2 vUv;          // テクスチャ座標(vertex shaderから)

uniform vec2 u_resolution; // 画面の解像度
uniform sampler2D u_tex;   // テクスチャ
uniform vec2 u_texsize;    // テクスチャのサイズ
uniform vec2 u_mouse;      // マウス座標

/**
 * vUvのテクスチャ座標をリサイズ(cover相当)に変換
 */
vec2 coverd_texture(vec2 res_size, vec2 tex_size) {
  // デモ02-02と同じなので省略
}

void main() {

  // リサイズ
  vec2 uv = coverd_texture(u_resolution, u_texsize);

  // 歪曲エフェクト
  // http://clemz.io/article-retro-shaders-webgl.htmlの、Barrel Distortionが元ネタです
  float distortion = 0.5;
  vec2 effect_origin = vec2(u_mouse.x + 0.5, u_mouse.y + 0.5);
  uv -= effect_origin;
  uv *= vec2(pow(length(uv), distortion));
  uv += effect_origin;

  gl_FragColor = texture2D(u_tex, uv);
}
```

エフェクトについては、
[Retro Shaders with WebGL - CLEMZ.IO](http://clemz.io/article-retro-shaders-webgl.html)の、Barrel Distortionが元ネタです。
詳しい仕組みについては、このページに詳しく載っているので、参照してみてください。
（その他、色々なエフェクトの例が載っているので、良いアイディアになると思います!！）
