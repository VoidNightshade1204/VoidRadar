# NexradJS

**FULL CREDIT GOES TO [netbymatt](https://github.com/netbymatt) for pretty much all of this project.**

He provided two libraries:<br>[nexrad-level-2-data](https://github.com/netbymatt/nexrad-level-2-data)<br>[nexrad-level-2-plot](https://github.com/netbymatt/nexrad-level-2-plot)<br>that allowed for the development of this project. I only take credit for porting these Node apps to the browser with [Browserify](https://browserify.org).

<br>

**Pretty much all of the code that plots the data to the map using WebGL came from [QuadWeather's Radar Demo page](https://quadweather.com/radar-demo)**. Please go share him some love [on Twitter](https://twitter.com/quadweather).

His main radar page (which inspired this entire repository to be made) can be found here: [https://radar.quadweather.com](https://radar.quadweather.com)

<br><br>

In summary, the majority of this app was not made by me. I wanted to give the credit that was due to the people that made the frameworks of this app, because this website would not exist today if it weren't for the libraries / code snippets they provided. Here are their links again:

[netbymatt](https://github.com/netbymatt) (link to GitHub profile)<br>
[QuadWeather](https://twitter.com/quadweather) (link to Twitter profile)

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