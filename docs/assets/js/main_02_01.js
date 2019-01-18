document.addEventListener('DOMContentLoaded', init);

async function init() {

  const container = document.getElementById('container');

  let camera, scene, renderer;
  let uniforms;

  let texture;

  // テクスチャの読み込み
  await loadTexture('./assets/img/lena_std.jpg');

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

  /**
   * 板ポリゴンを作成
   *
   * @return {Object} メッシュオブジェクト
   */
  function createPlaneMesh() {
    // 2x2の板ポリゴンを作成
    const geometry = new THREE.PlaneBufferGeometry(2, 2);

    // uniform変数を定義
    // ここで定義した変数が、shader内で利用できます
    uniforms = {
      u_tex : { type : "t",  value : texture } // テクスチャ
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