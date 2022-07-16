# NexradJS

**FULL CREDIT GOES TO [netbymatt](https://github.com/netbymatt) for pretty much all of this project.**

He provided two libraries:<br>[nexrad-level-2-data](https://github.com/netbymatt/nexrad-level-2-data)<br>[nexrad-level-2-plot](https://github.com/netbymatt/nexrad-level-2-plot)<br>that allowed for the development of this project. I only take credit for porting these Node apps to the browser with [Browserify](https://browserify.org).

# Setup
```
git clone https://github.com/SteepAtticStairs/NexradJS.git
cd NexradJS
npm install
npm run build
python3 -m http.server 8080
```
then you can go to `localhost:8080` to view the website.

You can also run
```
npm run serve
```
to use `watchify` (a part of Browserify) to auto-bundle the project every time you make a change.