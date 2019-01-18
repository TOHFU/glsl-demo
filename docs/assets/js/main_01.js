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