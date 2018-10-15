import 'styles/index.scss';

class Loader {
  constructor() {
    this.callback = null;
  }

  load(file) {
    const request = new XMLHttpRequest();

    request.open('GET', file, true);
    request.onprogress = (evt) => {
      let percent = Math.floor((evt.loaded / evt.total) * 100);

      this.callback(percent);
    };

    request.onload = () => { this.complete(file); };
    request.send();
  }

  progress(callback) { this.callback = callback; }

  complete() { }
}


export default class App {
  init() {
    this.loader = new Loader();
    this.loader.progress((percent) => {
      this.progress(percent);
    });

    this.playIntro = document.querySelector('.play-intro');
    this.loaderBar = document.querySelector('.loader');

    this.loader.load('https://iondrimbafilho.me/chaos.mp3');
    this.loader.complete = this.complete.bind(this);

    this.count = 0;
    this.percent = 0;
    this.playing = false;

    this.objects = [];

    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    this.camera.aspect = ww / wh;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(ww, wh);
  }

  progress(percent) {
    this.loaderBar.style.transform = `scale(${percent / 100}, 1)`;

    if (percent === 100) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          this.playIntro.classList.add('control-show');
          this.loaderBar.classList.add('removeLoader');
          this.loaderBar.style.transform = 'scale(1, 0)';
        })
      }, 300);
    }
  }

  complete(file) {
    setTimeout(() => {
      this.firstRing = new THREE.Object3D();
      this.secondRing = new THREE.Object3D();
      this.thirdRing = new THREE.Object3D();
      this.fourthRing = new THREE.Object3D();
      this.gui = new dat.GUI();
      this.gui.closed = true;
      this.angle = 0;

      this.setupAudio();
      this.loadTextures();
      this.addSoundControls();
      this.createScene();
      this.createCamera();
      this.addAmbientLight();
      this.addSpotLight();
      this.addCameraControls();
      this.addFloor();

      this.pointLightObj = {
        color: '#6900ff',
        intensity: 4,
        position: {
          x: -15,
          y: 29,
          z: 29,
        }
      };

      this.addPointLight(this.pointLightObj, 'first light');

      this.pointLightObj1 = {
        color: '#00ff00',
        intensity: 4,
        position: {
          x: 18,
          y: 22,
          z: -9,
        }
      };

      this.addPointLight(this.pointLightObj1, 'second light');

      this.pointLightObj2 = {
        color: '#5a00ff',
        intensity: 3.2,
        position: {
          x: 7,
          y: 62,
          z: -44,
        }
      };

      this.addPointLight(this.pointLightObj2, 'third light');

      this.pointLightObj3 = {
        color: '#1eff00',
        intensity: 1,
        position: {
          x: -90,
          y: 60,
          z: 5,
        }
      };

      this.addPointLight(this.pointLightObj3, 'fourth light');

      this.meshColorFirst = {
        color: '#111111',
        name: 'Mesh First'
      };

      this.createRingOfSpheres(20, 1, this.meshColorFirst, this.firstRing);

      this.meshColorSecond = {
        color: '#78ff00',
        name: 'Mesh Second'
      };

      this.createRingOfSpheres(30, 2, this.meshColorSecond, this.secondRing);

      this.meshColorThree = {
        color: '#3c00ff',
        name: 'Mesh Third'
      };

      this.createRingOfSpheres(40, 3, this.meshColorThree, this.thirdRing);

      this.meshColorFour = {
        color: '#ff005a',
        name: 'Mesh Fourth'
      };

      this.createRingOfSpheres(50, 4, this.meshColorFour, this.fourthRing);

      this.animate();

      this.playSound(file);
    }, 200);
  }

  addSoundControls() {
    this.btnPlay = document.querySelector('.play');
    this.btnPause = document.querySelector('.pause');

    this.btnPlay.addEventListener('click', () => {
      this.play();
    });

    this.btnPause.addEventListener('click', () => {
      this.pause();
    });
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
    this.camera.position.set(15, 15, 5);

    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  }

  addSpotLight() {
    const spotLight = new THREE.SpotLight(0xffffff);

    spotLight.position.set(0, 15, 0);
    spotLight.castShadow = true;

    this.scene.add(spotLight);
  }

  addPointLight(params, name) {
    const pointLight = new THREE.PointLight(params.color, params.intensity);
    pointLight.position.set(params.position.x, params.position.y, params.position.z);

    this.scene.add(pointLight);

    const lightGui = this.gui.addFolder(name);
    lightGui.add(params, 'intensity', 1, 10).onChange((intensity) => {
      pointLight.intensity = intensity;
    });

    lightGui.addColor(params, 'color').onChange((color) => {
      pointLight.color = this.hexToRgbTreeJs(color);
    });

    lightGui.add(params.position, 'x', -100, 100).onChange((x) => {
      pointLight.position.x = x;
    });

    lightGui.add(params.position, 'y', -100, 100).onChange((y) => {
      pointLight.position.y = y;
    });

    lightGui.add(params.position, 'z', -100, 100).onChange((z) => {
      pointLight.position.z = z;
    });
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight(0xffffff);

    this.scene.add(light);
  }

  createRingOfSpheres(count, radius, meshColor, group) {
    const geometry = new THREE.SphereGeometry(.3, 32, 32);
    const meshParams = {
      color: meshColor.color,
      cubemap: this.cubemap,
      metalness: .58,
      emissive: '#000000',
      roughness: .18,
      envMap: this.cubemap
    };

    const material = new THREE.MeshPhysicalMaterial(meshParams);

    const lightGui = this.gui.addFolder(meshColor.name);

    lightGui.addColor(meshParams, 'color').onChange((color) => {
      material.color = this.hexToRgbTreeJs(color);
    });

    lightGui.addColor(meshParams, 'emissive').onChange((emissive) => {
      material.emissive = this.hexToRgbTreeJs(emissive);
    });

    lightGui.add(meshParams, 'metalness', 0, 1).onChange((metalness) => {
      material.metalness = metalness;
    });

    lightGui.add(meshParams, 'roughness', 0, 1).onChange((roughness) => {
      material.roughness = roughness;
    });


    for (let index = 0; index < count; index++) {
      const l = 360 / count;
      const pos = this.radians(l * index);
      const obj = this.createObj(geometry, material);
      const distance = (radius * 2);
      const sin = Math.sin(pos) * distance;
      const cos = Math.cos(pos) * distance;

      obj.position.set(sin, 1, cos);

      this.objects.push(obj);

      group.add(obj);
    }

    this.scene.add(group);
  }

  createObj(geometry, material) {
    const obj = new THREE.Mesh(geometry, material);

    obj.castShadow = true;
    obj.receiveShadow = true;

    return obj;
  }

  addFloor() {
    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      normalMap: this.textureNormal,
    });

    this.plane = new THREE.Mesh(planeGeometry, material);

    planeGeometry.rotateX(- Math.PI / 2);

    this.plane.position.y = -2;
    this.plane.receiveShadow = true;

    this.scene.add(this.plane);
  }

  moveRingGroup(group, value) {
    group.rotation.y += value;
  }

  drawWave() {
    if (this.playing) {
      this.analyser.getByteFrequencyData(this.frequencyData);

      for (var i = 0; i < 140; i++) {
        const p = this.frequencyData[i];
        const s = this.objects[i];

        TweenMax.to(s.position, .3, {
          y: p / 30
        });
      }
    }

    this.moveRingGroup(this.firstRing, .01);
    this.moveRingGroup(this.secondRing, -.01);
    this.moveRingGroup(this.thirdRing, .02);
    this.moveRingGroup(this.fourthRing, -.02);
  }

  animate() {
    this.controls.update();

    this.drawWave();

    this.renderer.render(this.scene, this.camera);

    this.angle += .05;

    this.plane.rotation.y = this.radians(this.angle);

    requestAnimationFrame(this.animate.bind(this));
  }

  radians(degrees) {
    return degrees * Math.PI / 180;
  }

  hexToRgbTreeJs(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }

  map(value, start1, stop1, start2, stop2) {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
  }

  loadTextures() {
    this.textureNormal = new THREE.TextureLoader().load('https://raw.githubusercontent.com/iondrimba/images/master/metal_plate_Nor_1k.jpg');

    this.textureNormal.wrapS = THREE.RepeatWrapping;
    this.textureNormal.wrapT = THREE.RepeatWrapping;
    this.textureNormal.repeat.set(400, 400);

    const urls = [
      'https://iondrimbafilho.me/3d5/img/posx.jpg',
      'https://iondrimbafilho.me/3d5/img/negx.jpg',
      'https://iondrimbafilho.me/3d5/img/posy.jpg',
      'https://iondrimbafilho.me/3d5/img/negy.jpg',
      'https://iondrimbafilho.me/3d5/img/posz.jpg',
      'https://iondrimbafilho.me/3d5/img/negz.jpg'
    ];

    this.cubemap = new THREE.CubeTextureLoader().load(urls);
    this.cubemap.format = THREE.RGBAFormat;
  }

  setupAudio() {
    this.audioElement = document.getElementById('audio');
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();

    this.source = this.audioCtx.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.source.connect(this.audioCtx.destination);

    this.bufferLength = this.analyser.frequencyBinCount;

    this.frequencyData = new Uint8Array(this.bufferLength);
    this.audioElement.volume = .5;

    document.body.addEventListener('mouseup', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grab';
        document.body.style.cursor = '-webkit-grab';
      });
    });

    document.body.addEventListener('mousedown', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grabbing';
        document.body.style.cursor = '-webkit-grabbing';
      });
    });

    this.audioElement.addEventListener('playing', () => {
      this.playing = true;
    });

    this.audioElement.addEventListener('pause', () => {
      this.playing = false;
    });

    this.audioElement.addEventListener('ended', () => {
      this.playing = false;
    });
  }

  playSound(file) {
    setTimeout(() => {
      this.playIntro.addEventListener('click', (evt) => {
        evt.currentTarget.classList.remove('control-show');
        this.play();
      });

      this.audioElement.src = file;
    }, 500);
  }

  play() {
    this.audioCtx.resume();
    this.audioElement.play();
    this.btnPlay.classList.remove('control-show');
    this.btnPause.classList.add('control-show');
  }

  pause() {
    this.audioElement.pause();
    this.btnPause.classList.remove('control-show');
    this.btnPlay.classList.add('control-show');
  }
}
