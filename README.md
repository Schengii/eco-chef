# eco-chef

## Installation
```
npm run build
cordova platform add android
```
Edit platforms/android/build.gradle
```
repositories {
    maven {
        url = uri("https://dev-tools.int.dfg.de/nexus/repository/dfg-maven-group/")
    }
}
```

### run dev server
```
npm run dev
```
Webseite: http://localhost:4444

### build WepApp
```
npm run build
```

### build Android App
```
cordova run android
```
