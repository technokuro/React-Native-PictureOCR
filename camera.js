/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */


import React, { Component } from 'react';
import { StyleSheet, TouchableOpacity, View, ImageBackground, CameraRoll } from 'react-native';
import { RNCamera as Camera } from 'react-native-camera';
import RNTextDetector from "react-native-text-detector";
import style, { screenHeight, screenWidth } from "./styles";

const PICTURE_OPTIONS = {
  quality: 1,
  fixOrientation: true,
  forceUpOrientation: true,
};

export default class camera extends React.Component {
  state = {
    loading: false,
    image: null,
    error: null,
    visionResp: []
  };


  reset(error = "OTHER") {
    this.setState(
      {
        loading: false,
        image: null,
        error
      },
      () => {
        // setTimeout(() => this.camera.startPreview(), 500);
      }
    );
  }

  takePicture = async camera => {
    this.setState({
      loading: true
    });
    try {
      const data = await camera.takePictureAsync(PICTURE_OPTIONS);
      console.log("height = " + data.height);

      if (!data.uri) {
        throw "OTHER";
      }
      this.setState(
        {
          image: data.uri
        },
        () => {
          console.log(data.uri);

          this.processImage(data.uri, {
            height: data.height,
            width: data.width
          });
        }
      );
    } catch (e) {
      console.warn(e);
      this.reset(e);
    }
  };

  processImage = async (uri, imageProperties) => {
    const visionResp = await RNTextDetector.detectFromUri(uri);
    CameraRoll.saveToCameraRoll(uri);
    console.log(visionResp);
    if (!(visionResp && visionResp.length > 0)) {
      throw "UNMATCHED";
    }
    this.setState({
      visionResp: this.mapVisionRespToScreen(visionResp, imageProperties)
    });
  };


  mapVisionRespToScreen = (visionResp, imageProperties) => {
    const IMAGE_TO_SCREEN_Y = screenHeight / imageProperties.height;
    const IMAGE_TO_SCREEN_X = screenWidth / imageProperties.width;
    for (let i = 0; i < visionResp.length; i++) {
      if (visionResp[i].text.includes('\n')) {
        newvisionResp = cloneDeep(visionResp);
        var lineCount = 1;
        var lineCountForHeight = 1;
        while (visionResp[i].text.includes('\n')) {
          visionResp[i].text = visionResp[i].text.replace("\n", "");
          lineCountForHeight++;
        }
        visionResp[i].text = newvisionResp[i].text.substring(0, (newvisionResp[i].text.indexOf('\n') - 1));
        console.log("lineCountForHeight" + lineCountForHeight);
        while (newvisionResp[i].text.includes('\n')) {
          newvisionResp[i].text = newvisionResp[i].text.replace("\n", "$");
          if ((newvisionResp[i].text.substring(0, ((newvisionResp[i].text.indexOf('$') - 1)))) != visionResp[i].text) {
              console.log("newvisionResp[i].text = " + newvisionResp[i].text);
              this.setState(prevState => ({
                eachLine: [...prevState.eachLine, { text: (newvisionResp[i].text.substring(0, ((newvisionResp[i].text.indexOf('$') - 1)))), bounding: { height: (visionResp[i].bounding.height / lineCountForHeight), width: (visionResp[i].bounding.width), left: (visionResp[i].bounding.left), top: ((visionResp[i].bounding.top) + ((lineCount - 1) * ((visionResp[i].bounding.height) / lineCountForHeight))) } }]
              }));
          }
          
          newvisionResp[i].text = newvisionResp[i].text.replace((newvisionResp[i].text.substring(0, (newvisionResp[i].text.indexOf('$') + 1))), "");
          lineCount++;

        }
        this.setState(prevState => ({
          eachLine: [...prevState.eachLine, { text: (newvisionResp[i].text), bounding: { height: (visionResp[i].bounding.height / lineCountForHeight), width: (visionResp[i].bounding.width), left: (visionResp[i].bounding.left), top: ((visionResp[i].bounding.top) + ((lineCount - 1) * ((visionResp[i].bounding.height) / lineCountForHeight))) } }]
        }));
        visionResp[i].bounding.height = visionResp[i].bounding.height / lineCountForHeight;

      }
    };
    visionResp = this.state.eachLine.concat(visionResp);
    console.log(visionResp);
    console.log("visionResp.length = " + visionResp.length);

    return visionResp.map(item => {
      return {
        ...item,
        position: {
          width: item.bounding.width * IMAGE_TO_SCREEN_X,
          left: item.bounding.left * IMAGE_TO_SCREEN_X,
          height: item.bounding.height * IMAGE_TO_SCREEN_Y,
          top: item.bounding.top * IMAGE_TO_SCREEN_Y
        }
      };
    });
  };

  render() {
    return (
      <View style={style.screen}>
        {!this.state.image ? (
          <Camera
            ref={cam => {
              this.camera = cam;
            }}
            key="camera"
            style={style.camera}
            notAuthorizedView={null}
            flashMode={Camera.Constants.FlashMode.off}
          >
            {({ camera, status }) => {
              if (status !== "READY") {
                return null;
              }
              return (
                <View style={style.buttonContainer}>
                  <TouchableOpacity
                    onPress={() => this.takePicture(camera)}
                    style={style.button}
                  />
                </View>
              );
            }}
          </Camera>
        ) : null}
        {this.state.image ? (
          <ImageBackground
            source={{ uri: this.state.image }}
            style={style.imageBackground}
            key="image"
            resizeMode="stretch"
          >
            {this.state.visionResp.map(item => {
              return (
                <TouchableOpacity
                  style={[style.boundingRect, item.position]}
                  key={item.text}
                  onPress={() => (alert(item.text))}
                />

              );
            })}
          </ImageBackground>
        ) : null}
      </View>
    );
  }
}
camera.navigationOptions = {
  title: 'React Native Text Detector camera',

};