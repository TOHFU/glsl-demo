# glsl-demo - webGLでGLSLを使うデモ

view demo page : https://tohfu.github.io/glsl-demo/



## デモ01：板ポリゴンにfragment shaderで色をつけてみる

まずは、上記の板ポリを使って、シェーダーを使ってみるところまで、行ってみます。

ここでは、板ポリゴンを作成しで3D空間上に配置し、これをカメラで撮影したものをcanvasに描画しています。
この板ポリゴンに、カスタムシェーダーを設定します。

01_simple_color.html : https://tohfu.github.io/glsl-demo/01_simple_color.html

```
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

/assets/js/main.js

```
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

#### カスタムシェーダーを板ポリゴンに設定する

three.jsでカスタムシェーダーを使うときは、`THREE.ShaderMaterial()`を使います。

```
const material = new THREE.ShaderMaterial({
  uniforms       : uniforms,
  vertexShader   : document.getElementById('vertexShader').textContent,  // vertex shaderの指定
  fragmentShader : document.getElementById('fragmentShader').textContent // fragment shaderの指定
});
```
で、htmlの方に記述した各shaderの設定と、jsからシェーダーにマウス座標・画像サイズを送るため、カスタム変数(uniform変数：後述)を設定しています。

#### カスタムシェーダーについて

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
vertex shaderに渡される頂点情報の変数です。three.jsで定義されているので、詳しくは[Built-in uniforms and attributes](https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram) などを参考にしてみてください。

ここでは、
gl_Positionにはattribute変数であるpositionをそのまま設定、
gl_FragColorにはどのピクセルであっても一律`vec4(1.0, 0.0, 1.0, 1.0)`を返している
ので、画面が単色の紫になっていると思います。

このように、fragment shaderのmain()内でどのようなピクセル色情報を返してあげるか、がポイントになります。



## デモ02-01：板ポリゴンにテクスチャを設定してみる

02_01_simple_texture.html : https://tohfu.github.io/glsl-demo/02_01_simple_texture.html

次に、このfragment shaderにテクスチャを設定してみます。

jsは共通です。htmlのvertex/fragment shaderの部分だけ修正します。

```
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
```

#### varyng変数について

vertex/fragment shader両方に、
```
varying vec2 vUv;
```
の宣言が増えました。これはvarying変数といい、vertex shader -> fragment shaderで値を渡したいときに使用する変数です。
ここでは、attribute変数であるuv(頂点位置に対応するテクスチャ画像の座標)を、vUvというvarying変数にそのまま代入して、fragment shaderに渡しています。

#### uniform変数について

fragment shader側では、テクスチャ画像を読み込むために以下の宣言をしています。
```
uniform sampler2D u_tex;
```
これは、uniform変数といい、CPU(ここではjs)側から汎用的なデータを送ることができます。
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

#### テクスチャの表示

fragment shader側では、上記座標データ(vUv)と、テクスチャデータ(u_tex)をもとに、どの座標のピクセル色情報をgl_FragColorに設定するか決めています。
このマッピングは、texture2D(texture, uv)という関数が用意されています。

なんかここまでひたすらお作法ですね。いきなり出てくる変数が多いので、これを知っておかないと、GLSLわかりにくいーってなると思います。



## デモ02-02：テクスチャの画角を固定する(background-size: cover相当に)

02_02_simple_texture_scaled.html : https://tohfu.github.io/glsl-demo/02_02_simple_texture_scaled.html

先ほどの[デモ02-01](https://tohfu.github.io/glsl-demo/02_01_simple_texture.html)では、ウインドウサイズを変更した時に、テクスチャの画角が変わってしまいました。
サイズ固定のcanvasで使うときは問題ないですが、もう少し実用的に使えるように改善してみます。

```
<!-- vertex shaderをここに記述 -->
<script id="vertexShader" type="x-shader/x-vertex">
  varying vec2 vUv; // fragment shaderに渡すための変数を定義

  void main() {
    vUv = uv; // 頂点ごとのuv座標を定義
    gl_Position = vec4(position, 1.0);
  }
</script>
<!-- /vertex shaderをここに記述 -->

<!-- fragment shaderをここに記述 -->
<script id="fragmentShader" type="x-shader/x-fragment">
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
</script>
<!-- /fragment shaderをここに記述 -->
```

GLSL的に新しいことはあまりないのですが、
ウインドウと、テクスチャ画像のアスペクト比を比較し、x軸とy軸の拡大率に適応しています。
こんな風に、必要な情報をuniformに詰めて計算に使用する。という流れです。