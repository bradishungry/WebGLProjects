/*
 * A JS class to create a solar system in WebGL using ThreeJS
 * Uses a ship for a fun way to explore, as well as contains a standalone
 * camera for extra exploration. Most objects are randomly generated.
 */

/*
 * probably too many globals, as I couldn't pass in some to the
 * keyhandler for some reason. Can cut out 6 of these easily with a show
 * fire function, or something.
 */

var camera;

//ship body
var hull;

//dummy ship body for camera
var chull;

var fire1;
var fire2;
var firelight;
var fire2light;
var engine1fire;
var engine2fire;

//used for calculating free camera
var standcam = false;
var counter = 0.0;
var cstate;


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
   if (event.which == null) {
      return String.fromCharCode(event.keyCode) // IE
   } else if (event.which!=0 && event.charCode!=0) {
      return String.fromCharCode(event.which)   // the rest
   } else {
      return null // special key
   }
}

function cameraControl(c, c2, ch)
{
   var distance = c.position.length();
   var q, q2;

   switch (ch)
   {
      // camera controls
      case 'w':
         c.translateZ(-0.2);
         //if standcam controls free cam vs chase cam
         if(standcam == false){
            c2.translateZ(-0.2);
            console.log(c.position);
            fire1.visible = true;
            fire2.visible = true;
            engine1fire.visible = true;
            engine2fire.visible = true;
            firelight.visible = true;
            fire2light.visible = true;
         }
         return true;
      case 'a':
         if(standcam == true){
            c.translateX(-0.2);
         }

         if(standcam == false){
            c.rotateZ(0.1);
            counter += 0.1;
         }
         return true;
      case 's':
         if(standcam == true){
            c.translateZ(0.2);
         }
         if(standcam == false){
            c.rotateX(5 * Math.PI / 180);
            c2.rotateZ(counter);
            c2.rotateX(5 * Math.PI / 180);
            counter = 0.0;
         }
         return true;
      case 'd':
         if(standcam == true){
            c.translateX(0.2);
         }
         if(standcam == false){
            c.rotateZ(-0.1);
            counter -= 0.1;
         }
         return true;
      case 'e':
         if(standcam == false){
            c.rotateX(-5 * Math.PI / 180);
            c2.rotateZ(counter);
            counter = 0.0;
            c2.rotateX(-5 * Math.PI / 180);
         }
         return true;
      case 'r':
         if(standcam == true){
            c.translateY(0.1);
         }
         return true;
      case 'f':
         if(standcam == true){
            c.translateY(-0.1);
         }
         return true;
      case 'j':
         // need to do extrinsic rotation about world y axis, so multiply camera's quaternion
         // on left
         if(standcam == true){
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
         }
         return true;
      case 'l':
         if(standcam == true){
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  -5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
         }

         return true;
      case 'i':
         // intrinsic rotation about camera's x-axis
         if(standcam == true){
            c.rotateX(5 * Math.PI / 180);
         }
         return true;
      case 'k':
         if(standcam == true){
            c.rotateX(-5 * Math.PI / 180);
         }


         return true;
      case 'O':
         if(standcam == true){
            c.lookAt(new THREE.Vector3(0, 0, 0));
         }
         return true;
      case 'S':
         if(standcam == true){
            c.fov = Math.min(80, c.fov + 5);
            c.updateProjectionMatrix();
         }
         return true;
      case 'W':
         if(standcam == true){
            c.fov = Math.max(5, c.fov  - 5);
            c.updateProjectionMatrix();
         }
         return true;

         // alternates for arrow keys
      case 'J':
         if(standcam == true){
            //this.orbitLeft(5, distance)
            c.translateZ(-distance);
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
            c.translateZ(distance);
         }
         return true;
      case 'L':
         if(standcam == true){
            //this.orbitRight(5, distance)
            c.translateZ(-distance);
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  -5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
            c.translateZ(distance);
         }
         return true;
      case 'I':
         //this.orbitUp(5, distance)
         if(standcam == true){
            c.translateZ(-distance);
            c.rotateX(-5 * Math.PI / 180);
            c.translateZ(distance);
         }
         return true;
      case 'K':
         if(standcam == true){
            //this.orbitDown(5, distance)
            c.translateZ(-distance);
            c.rotateX(5 * Math.PI / 180);
            c.translateZ(distance);
         }
         return true;

      //disconnects/reconnects chase camera
      case 'B':

         //if disconnecting, save position state, change boolean
         if(standcam === false){
            //the only reason camera needs to be global at least until I find
            //the passing in bug
            cstate = new Float32Array([camera.position.x, camera.position.y, camera.position.z]);
            standcam = true;

         //if reconnecting, set position with y - 0.1 because camera y is hull y
         //+ 0.1, look at origin for the angle, and set y back.
         } else if(standcam === true) {
            c.position.setX(cstate[0]);
            c.position.setY(cstate[1] - 0.1);
            c.position.setZ(cstate[2]);
            c.lookAt(new THREE.Vector3(0, 0, 0));
            c.position.setY(cstate[1]);
            standcam = false;
         }

         return true;
   }


   return false;
}

function handleKeyPress(event)
{
   var ch = getChar(event);
   if(standcam === false){
      if (window.onkeydown(cameraControl(hull, chull, ch))) return
   } else {
      if (window.onkeydown(cameraControl(camera, chull, ch))) return;
   }
}

function start()
{
   window.onkeypress = handleKeyPress;

   var scene = new THREE.Scene();

   var ourCanvas = document.getElementById('theCanvas');
   var renderer = new THREE.WebGLRenderer({canvas: ourCanvas});

   //could use a path variable at ../images, but vim doesn't autocomplete that
   //way :' (
   var met_tex = ['../images/met/met1.jpg',
      '../images/met/met2.jpg',
      '../images/met/met3.jpg',
      '../images/met/met4.jpg',
      '../images/met/met5.jpg'];
   var pl_tex = ['../images/planets/e1.jpg',
      '../images/planets/e2.jpg',
      '../images/planets/e3.jpg',
      '../images/planets/e4.jpg',
      '../images/planets/e5.jpg'];
   var url = "../images/clover_really_small.jpg";
   var f_url = "../images/fire.jpg";

   var loader = new THREE.TextureLoader();

   var texture = loader.load(url);
   //I am funny
   var my_mixtape = loader.load(f_url);

   var metal = loader.load("../images/metal.jpg");

   //sun
   var geometry = new THREE.SphereGeometry( 5, 50, 50 );
   var material = new THREE.MeshBasicMaterial( { map: my_mixtape} );
   var planet = new THREE.Mesh( geometry, material );
   scene.add(planet);

   var p1 = loader.load(pl_tex[0]);
   var p2 = loader.load(pl_tex[1]);
   var p3 = loader.load(pl_tex[2]);
   var p4 = loader.load(pl_tex[3]);
   var p5 = loader.load(pl_tex[4]);


   //random generation of 20 planets and some moons
   for(var i = 0; i < 20; i++){
      var pmars = new THREE.SphereGeometry( (Math.random() * 100000) % 4, (Math.random() * 100000) % 50, (Math.random() * 100000) % 50);
      var bound3 = Math.random();

      //should probably switch to case, might change random specular in future for
      //less perfect planets, set random textures
      if(bound3 < 0.15){
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p1, specular: 0x222222, shininess: 50} );
      } else if(bound3 > 0.15 && bound3 < 0.3) {
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p2, specular: 0x222222, shininess: 50} );
      } else if(bound3 > 0.3 && bound3 < 0.45) {
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p3, specular: 0x222222, shininess: 50} );
      } else if(bound3 > 0.45 && bound3 < 0.5) {
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p4, specular: 0x222222, shininess: 50} );
      } else if(bound3 > 0.5 && bound3 < 0.65) {
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p5, specular: 0x222222, shininess: 50} );
      } else if(bound3 > 0.65 && bound3 < 0.8) {
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p1, specular: 0x222222, shininess: 50} );
      } else if(bound3 > 0.8 && bound3 < 0.95) {
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p2, specular: 0x222222, shininess: 50} );
      } else {
         var marsmaterial = new THREE.MeshPhongMaterial( { map: p3, specular: 0x222222, shininess: 50} );
      }

      //use for random colors instead
      //var marsmaterial = new THREE.MeshPhongMaterial( { color: ("#"+Math.floor(Math.random()*16777215).toString(16)), specular: 0x222222, shininess: 50} );
      var mars = new THREE.Mesh( pmars, marsmaterial );

      //set random location, doesn't really matter how varried because y is 0
      //and they spin different speeds
      if(Math.random() < 0.5){
         mars.position.set((Math.random() * 100000) % 180, 0, (Math.random() * 100000) % 180);
      } else {
         mars.position.set(-(Math.random() * 100000) % 180, 0, -(Math.random() * 100000) % 180);
      }

      planet.add(mars);

      //create random moons if a planet gets lucky
      var bound4 = Math.random();
      if(bound4< 0.2){
         var pmoon = new THREE.SphereGeometry( (Math.random() * 100000) % 2, (Math.random() * 100000) % 20, (Math.random() * 100000) % 30);
         var moonmaterial = new THREE.MeshPhongMaterial( { map: metal, specular: 0x222222, shininess: 50} );
         var moon = new THREE.Mesh( pmoon, moonmaterial );
         moon.position.set((Math.random() * 100000) % 10, 0, (Math.random() * 100000) % 10);
         mars.add(moon);
      }
   }

   var met1 = loader.load(met_tex[0]);
   var met2 = loader.load(met_tex[1]);
   var met3 = loader.load(met_tex[2]);
   var met4 = loader.load(met_tex[3]);
   var met5 = loader.load(met_tex[4]);

   //create a bunch of satillites for a more interesting scene
   for(var j = 0; j < 100; j++){
      //using a small number of faces for jagged effects
      var met = new THREE.SphereGeometry( (Math.random() * 100000) % 3, (Math.random() * 100000) % 10, (Math.random() * 100000) % 10);
      var bound2 = Math.random();

      if(bound2 < 0.15){
         var metmaterial = new THREE.MeshPhongMaterial( { map: met1, specular: 0x222222, shininess: 50} );
      } else if(bound2 > 0.15 && bound2 < 0.3) {
         var metmaterial = new THREE.MeshPhongMaterial( { map: met2, specular: 0x222222, shininess: 50} );
      } else if(bound2 > 0.3 && bound2 < 0.45) {
         var metmaterial = new THREE.MeshPhongMaterial( { map: met3, specular: 0x222222, shininess: 50} );
      } else if(bound2 > 0.45 && bound2 < 0.5) {
         var metmaterial = new THREE.MeshPhongMaterial( { map: met4, specular: 0x222222, shininess: 50} );
      } else if(bound2 > 0.5 && bound2 < 0.65) {
         var metmaterial = new THREE.MeshPhongMaterial( { map: met5, specular: 0x222222, shininess: 50} );
      } else if(bound2 > 0.65 && bound2 < 0.8) {
         var metmaterial = new THREE.MeshPhongMaterial( { map: met1, specular: 0x222222, shininess: 50} );
      } else if(bound2 > 0.8 && bound2 < 0.95) {
         var metmaterial = new THREE.MeshPhongMaterial( { map: met2, specular: 0x222222, shininess: 50} );
      } else {
         var metmaterial = new THREE.MeshPhongMaterial( { map: met3, specular: 0x222222, shininess: 50} );
      }

      var meteor = new THREE.Mesh( met, metmaterial );
      var bound = Math.random();

      //position is much more important here
      if(bound < 0.15){
         meteor.position.set((Math.random() * 100000) % 280,(Math.random() * 100000) % 100 , (Math.random() * 100000) % 200);
      } else if(bound > 0.15 && bound < 0.3){
         meteor.position.set(-(Math.random() * 100000) % 280,(Math.random() * 100000) % 100 , (Math.random() * 100000) % 200);
      } else if(bound > 0.3 && bound < 0.45){
         meteor.position.set((Math.random() * 100000) % 280, -(Math.random() * 100000) % 100 , (Math.random() * 100000) % 200);
      } else if(bound > 0.45 && bound < 0.5) {
         meteor.position.set((Math.random() * 100000) % 280,(Math.random() * 100000) % 100 , -(Math.random() * 100000) % 200);
      } else if(bound > 0.5 && bound < 0.65) {
         meteor.position.set(-(Math.random() * 100000) % 280,-(Math.random() * 100000) % 100 , (Math.random() * 100000) % 200);
      } else if(bound > 0.65 && bound < 0.8) {
         meteor.position.set(-(Math.random() * 100000) % 280,(Math.random() * 100000) % 100 , -(Math.random() * 100000) % 200);
      } else if(bound > 0.8 && bound < 0.95) {
         meteor.position.set((Math.random() * 100000) % 280,-(Math.random() * 100000) % 100 , -(Math.random() * 100000) % 200);
      } else {
         meteor.position.set(-(Math.random() * 100000) % 280,-(Math.random() * 100000) % 100 , -(Math.random() * 100000) % 200);
      }

      scene.add(meteor);

   }

   var base = new THREE.CylinderGeometry(0.075, 0.075, 0.3, 32);
   base.rotateX(-90 * Math.PI / 180);
   var base_material = new THREE.MeshPhongMaterial({map: texture, specular: 0x222222, shininess: 50});
   hull = new THREE.Mesh( base, base_material );
   hull.position.set(9.4, -20, 129);
   //dummy
   chull = new THREE.Mesh( base, base_material );
   chull.position.set(9.4, -20, 129);
   chull.visible = false;
   scene.add(hull);
   scene.add(chull);

   var thrust = new THREE.ConeGeometry(0.03, 0.03, 0.1);
   thrust.rotateX(-90 * Math.PI / 180);
   var thrust_material = new THREE.MeshPhongMaterial({map: metal, specular: 0x222222, shininess: 50});
   var thruster = new THREE.Mesh( thrust, thrust_material);
   thruster.position.set(-0.05, -0.05, 0.14);
   hull.add(thruster);

   var thrust2 = new THREE.ConeGeometry(0.03, 0.03, 0.1);
   thrust2.rotateX(-90 * Math.PI / 180);
   var thruster2 = new THREE.Mesh( thrust2, thrust_material);
   thruster2.position.set(0.05, -0.05, 0.14);
   hull.add(thruster2);

   var wings = new THREE.BoxGeometry(0.5, 0.02, 0.1);
   var wing_material = new THREE.MeshPhongMaterial({map: metal, specular: 0x222222, shininess: 50});
   var wing = new THREE.Mesh( wings, wing_material);
   wing.position.set(0.0, 0.0, 0.0);
   hull.add(wing);

   var engine1 = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 32);
   engine1.rotateX(-90 * Math.PI / 180);
   var engine_material = new THREE.MeshPhongMaterial({map: metal, specular: 0x222222, shininess: 50});
   var e1 = new THREE.Mesh(engine1, engine_material);
   e1.position.set(0.21, -0.03, 0.0);
   hull.add(e1);

   var engine2 = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 32);
   engine2.rotateX(-90 * Math.PI / 180);
   var e2 = new THREE.Mesh(engine2, engine_material);
   e2.position.set(-0.21, -0.03, 0.0);
   hull.add(e2);

   var con = new THREE.ConeGeometry(0.07, 0.1, 0.15);

   con.rotateX(-90 * Math.PI / 180);
   var con_material = new THREE.MeshPhongMaterial({map: metal, specular: 0x222222, shininess: 50});
   var front = new THREE.Mesh( con, con_material );
   front.position.set(0, 0, -0.2);

   hull.add(front);

   camera = new THREE.PerspectiveCamera( 45, 1.5, 0.1, 1000 );
   camera.position.x = 0;
   camera.position.y = 0.1;
   camera.position.z = 0.8;
   chull.add(camera);

   //set invisible until moving forward
   var fire = new THREE.ConeGeometry(0.03, 0.03, 0.1);
   fire.rotateX(90 * Math.PI / 180);
   var fire_material = new THREE.MeshPhongMaterial({map: my_mixtape, specular: 0x222222, shininess: 50});
   fire1 = new THREE.Mesh(fire, fire_material);
   fire1.position.set(0.05, -0.05, 0.164);
   hull.add(fire1);
   fire1.visible = false;

   var fire_2 = new THREE.ConeGeometry(0.03, 0.03, 0.1);
   fire_2.rotateX(90 * Math.PI / 180);
   fire2 = new THREE.Mesh(fire_2, fire_material);
   fire2.position.set(-0.05, -0.05, 0.164);
   hull.add(fire2);
   fire2.visible = false;
   console.log(planet.position);
   console.log(camera.position);

   var engine1_fire = new THREE.ConeGeometry(0.02, 0.02, 0.1);
   engine1_fire.rotateX(90 * Math.PI / 180);
   engine1fire = new THREE.Mesh(engine1_fire, fire_material);
   engine1fire.position.set(0.21, -0.03, 0.06);
   hull.add(engine1fire);
   engine1fire.visible = false;

   var engine2_fire = new THREE.ConeGeometry(0.02, 0.02, 0.1);
   engine2_fire.rotateX(90 * Math.PI / 180);
   engine2fire = new THREE.Mesh(engine2_fire, fire_material);
   engine2fire.position.set(-0.21, -0.03, 0.06);
   hull.add(engine2fire);
   engine2fire.visible = false;

   //I couldn't get an earth OBJ to load, so behold the mighty God bunny
   var parent = planet;
   var oLoader = new THREE.OBJLoader();
   oLoader.load( '../models/bunny_cylindrical_tex.obj', function ( object ) {
      object.traverse( function ( child ) {
         if ( child instanceof THREE.Mesh ) {
            child.material.map = loader.load(met_tex[1]);
         }
      } );

      object.position.x = 60;
      object.position.y = 0;
      object.position.z = 0;
      object.scale.set(10, 10, 10);
      parent.add(object);
   });

   oLoader.load( '../models/teapot.obj', function ( tp ) {
      tp.traverse( function ( tpc ) {
         if ( tpc instanceof THREE.Mesh ) {
            tpc.material.map = loader.load(pl_tex[1]);
         }
      } );

      tp.position.set(0.0, 0.09, 0.0);
      tp.rotateY(90 * Math.PI / 180);
      tp.scale.set(0.0006, 0.0006, 0.0006);
      hull.add(tp);
   });

   var rotation = 0;
   var increment = 0.2 * Math.PI / 180.0;

   //using this over the other way because the other way is depreciated
   var l = new THREE.CubeTextureLoader();
   l.setPath( "../images/park/" );

   var texCube = l.load( [
      'hei.jpg', 'hei.jpg',
      'hei.jpg', 'hei.jpg',
      'hei.jpg', 'hei.jpg'
   ] );

   //sunlight
   var mat = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: texCube } );
   scene.background = texCube;
   var light = new THREE.PointLight(0xffffff, 1.0);
   planet.add(light);

   firelight = new THREE.PointLight(0xffffff, 1.0, 2.0);
   hull.add(firelight);
   firelight.position.set(-0.5, -0.5, 0.164 + 0.42);
   firelight.visible = false;

   fire2light = new THREE.PointLight(0xffffff, 1.0, 2.0);
   hull.add(fire2light);
   fire2light.position.set(0.5, -0.5, 0.164 + 0.42);
   fire2light.visible = false;

   //Random spooky sci-fi horror light
   silight = new THREE.PointLight(0xaa3d3e, 1.0, 2.0);
   hull.add(silight);
   silight.position.set(0.0, 0.5, 0.0);
   silight.visible = false;

   window.setInterval(function(){
      if(silight.visible === false){
         silight.visible = true;
      } else {
         silight.visible = false;
      } return
   }, 2000);

   //Probably a better way to do this, but there is probably a better way to
   //move the ship in general
   window.onkeyup = function(){ fire1.visible = false;
      fire2.visible = false;
      firelight.visible = false;
      fire2light.visible = false;
      engine1fire.visible = false;
      engine2fire.visible = false};

   //random movement interval
   var planet_d = 3 * Math.PI / 180.0;

   var render = function () {
      requestAnimationFrame( render );
      rotation += increment;
      planet.traverse(
         //planet rotations
         function ( object ) {
            object.traverse(
               //moon rotations
               function ( child ) {
                  child.rotation.y = rotation;
               });

            //As far as i can tell, the speed will always be the same for each
            //object each pass, because it will traverse the objects the same
            //way
            if(rotation < planet_d){
               object.rotation.y = planet_d - rotation;
               planet_d -= 0.08;
               Math.max(planet_d, 0.01);
            } else {
               object.rotation.y = planet_d - rotation;
            }
         });

      planet_d = 3 * Math.PI / 180.0;

      renderer.render(scene, camera);
   };

   render();
}
