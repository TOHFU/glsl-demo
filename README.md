# glsl-demo - webGLでGLSLを使うデモ

## デモ01：板ポリゴンにfragment shaderで色をつけてみる

view demo page : https://tohfu.github.io/glsl-demo/

まずは、上記の板ポリを使って、シェーダーを使ってみるところまで、行ってみます。

ここでは、板ポリゴンを作成しで3D空間上に配置し、これをカメラで撮影したものをcanvasに描画しています。
この板ポリゴンに、カスタムシェーダーを設定します。

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

```javascript
document.addEventListener('DOMContentLoaded', async () => {

  let container;
  let camera, scene, renderer;
  let uniforms;

  let loader = new THREE.TextureLoader();
  let texture;

  // テクスチャの読み込み
  await loadTexture('./assets/img/lena_std.jpg');

  // 初期化
  init();

  // アニメーション
  animate();

  /**
   * テクスチャの読み込み
   *
   * @param imagePath 画像のパス
   */
  function loadTexture(imagePath) {
    return new Promise(resolve => {
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

  /**
   * 初期化
   */
  function init() {
    container = document.getElementById('container');

    // カメラを作成
    camera = new THREE.Camera();
    camera.position.z = 1;

    // シーンを作成
    scene = new THREE.Scene();

    // 板ポリゴンのメッシュをシーンに追加
    scene.add(createPlaneMesh());

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);

    container.appendChild(renderer.domElement);

    // リサイズイベント
    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    // マウス移動イベント
    document.addEventListener('pointermove', onPointerMove, true);
  }

  /**
   * 板ポリゴンを作成
   */
  function createPlaneMesh() {
    // 2x2の板ポリゴンを作成
    const geometry = new THREE.PlaneBufferGeometry(2, 2);

    // uniform変数を定義
    // ここで定義した変数が、shader内で利用できます
    uniforms = {
      u_time       : { type : "f" , value : 1.0 },                        // 時間
      u_resolution : { type : "v2", value : new THREE.Vector2() },        // 画面の解像度
      u_tex        : { type : "t",  value : texture },                    // テクスチャ
      u_texsize    : { type : "v2", value : new THREE.Vector2(texture.image.width, texture.image.height)}, // テクスチャのサイズ
      u_mouse      : { type : "v2", value : new THREE.Vector2() }         // マウス座標
    };

    // 板ポリに貼り付けるマテリアルを作成
    // shaderを利用するときは、ShaderMaterialを使う
    const material = new THREE.ShaderMaterial({
      uniforms       : uniforms,
      vertexShader   : document.getElementById('vertexShader').textContent,  // vertex shaderの指定
      fragmentShader : document.getElementById('fragmentShader').textContent // fragment shaderの指定
    });
    material.extensions.derivatives = true;

    // メッシュを作成
    return new THREE.Mesh(geometry, material);
  }

  /**
   * 画面のリサイズ
   */
  function onWindowResize(event) {
    // リサイズ
    renderer.setSize( window.innerWidth, window.innerHeight );
    // uniform変数の位置情報を更新
    uniforms.u_resolution.value.x = renderer.domElement.width;
    uniforms.u_resolution.value.y = renderer.domElement.height;
  }

  /**
   * マウスポインタ一の取得(画面左下が原点)
   */
  function onPointerMove(event) {
    // uniform変数のマウスポインタ情報を更新
    let ratio = window.innerHeight / window.innerWidth;
    uniforms.u_mouse.value.x = (event.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
    uniforms.u_mouse.value.y = (event.pageY - window.innerHeight / 2) / window.innerHeight * -1;
  }

  /**
   * アニメーション
   */
  function animate(delta) {
    requestAnimationFrame( animate );
    render(delta);
  }

  /**
   * 描画
   */
  function render(delta) {
    uniforms.u_time.value = delta;
    renderer.render( scene, camera );
  }

});
```

### カスタムシェーダーを板ポリゴンに設定する

three.jsでカスタムシェーダーを使うときは、`THREE.ShaderMaterial()`を使います。

```
const material = new THREE.ShaderMaterial({
  uniforms       : uniforms,
  vertexShader   : document.getElementById('vertexShader').textContent,  // vertex shaderの指定
  fragmentShader : document.getElementById('fragmentShader').textContent // fragment shaderの指定
});
```
で、htmlの方に記述した各shaderの設定と、jsからシェーダーにマウス座標・画像サイズを送るため、カスタム変数(uniform変数：後述)を設定しています。

### カスタムシェーダーについて

肝心のshaderについてですが、

vertex shader
```
void main() {
  gl_Position = vec4(position, 1.0);
}
```

fragment shader
```
void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // ここで各ピクセルに固定の色を指定しています
}
```
としています。

vertex/fragment shaderのルールとして、それぞれ、main()関数内でGLSLの組み込み変数に、下記の値を設定する必要があります。

vertex shader : `gl_Position`に、頂点情報を設定
fragment shader : `gl_FragColor`に、ピクセルの色情報を設定

また、vertex shaderの方で、いきなりpositionという変数が使われていますが、これはattribute変数と呼ばれるものです。
vertex shaderに渡される頂点情報の変数です。GLSLで定義されているので、詳しくは(リンク)[TODO] などを参考にしてみてください。

ここでは、
gl_Positionにはattribute変数であるpositionをそのまま設定、
gl_FragColorにはどのピクセルであっても一律`vec4(1.0, 0.0, 1.0, 1.0)`を返している
ので、画面が単色の紫になっていると思います。

このように、fragment shaderのmain()内でどのようなピクセル色情報を返してあげるか、がポイントになります。



## デモ02-01：テクスチャを設定してみる

次に、このfragment shaderにテクスチャを設定してみます。

jsは共通です。

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GLSL Sample - 02.simple texture</title>
  <style type="text/css">
    html, body {
      margin: 0;
    }
  </style>
</head>

<body>
  <div id="container"></div>

  <!-- vertex shaderをここに記述 -->
  <script id="vertexShader" type="x-shader/x-vertex">
    varying vec2 vUv; // fragment shaderに渡すための変数を定義

    void main() {
      vUv = uv; // 頂点ごとのuv座標をそのまま設定
      gl_Position = vec4(position, 1.0);
    }
  </script>
  <!-- /vertex shaderをここに記述 -->

  <!-- fragment shaderをここに記述 -->
  <script id="fragmentShader" type="x-shader/x-fragment">
    varying vec2 vUv;          // テクスチャ座標(vertex shaderから)

    uniform sampler2D u_tex;   // テクスチャ

    void main() {
      gl_FragColor = texture2D(u_tex, vUv);
    }
  </script>
  <!-- /fragment shaderをここに記述 -->

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/98/three.min.js"></script>
  <script src="./assets/js/main.js"></script>
</body>

</html>
```

### varyng変数について

vertex/fragment shader両方に、
```
varying vec2 vUv;
```
の宣言が増えました。これはvarying変数といい、vertex shader -> fragment shaderで値を渡したいときに使用する変数です。
ここでは、attribute変数であるuv(頂点位置に対応するテクスチャ画像の座標)を、vUvというvarying変数にそのまま代入して、fragment shaderに渡しています。

### uniform変数について

また、fragment shader側では、
```
uniform sampler2D u_tex;
```
の宣言をしています。これは、uniform変数といい、CPU(ここではjs)側から汎用的なデータを送ることができます。
今回は、js側で`THREE.TextureLoader()`という、画像読み込み用のユーティリティ関数を使って読み込んだ画像データを、uniform変数に設定しています。

main.jsの、
```
uniforms = {
  u_time       : { type : "f" , value : 1.0 },                        // 時間
  u_resolution : { type : "v2", value : new THREE.Vector2() },        // 画面の解像度
  u_tex        : { type : "t",  value : texture },                    // テクスチャ
  u_texsize    : { type : "v2", value : new THREE.Vector2(texture.image.width, texture.image.height)}, // テクスチャのサイズ
  u_mouse      : { type : "v2", value : new THREE.Vector2() }         // マウス座標
};
```
で設定した値です。(この後のデモのために、色々設定しています。)

### テクスチャの表示

fragment shader側では、上記座標データ(vUv)と、テクスチャデータ(u_tex)をもとに、どの座標のピクセル色情報をgl_FragColorに設定するか決めています。
このマッピングは、texture2D(texture, uv)という関数が用意されています。

なんかここまでひたすらお作法ですね。いきなり出てくる変数が多いので、これを知っておかないと、GLSLわかりにくいーってなると思います。


