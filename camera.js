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



    console.log("image height = " + imageProperties.height);
    console.log("IMAGE_TO_SCREEN_Y = " + IMAGE_TO_SCREEN_Y);
    console.log("IMAGE_TO_SCREEN_X = " + IMAGE_TO_SCREEN_X);

    return visionResp.map(item => {
      let count = 1;
      if (item.text.includes('\n')) {
        while (item.text.includes('\n')) {
          item.text = item.text.replace("\n", "");
          count = count + 1;
        }

        console.log("item.text = " + item.text);
        console.log("count = " + count);
        for(let i = 0 ; i < count ; i++){
          return {
            ...item,
            position: {
              width: item.bounding.width * IMAGE_TO_SCREEN_X,
              left: item.bounding.left * IMAGE_TO_SCREEN_X,
              height: item.bounding.height * IMAGE_TO_SCREEN_Y / count,
              top: (item.bounding.top * IMAGE_TO_SCREEN_Y) + i * (item.bounding.height * IMAGE_TO_SCREEN_Y / count)
            }
          };
        }
      } else {
        return {
          ...item,
          position: {
            width: item.bounding.width * IMAGE_TO_SCREEN_X,
            left: item.bounding.left * IMAGE_TO_SCREEN_X,
            height: item.bounding.height * IMAGE_TO_SCREEN_Y,
            top: item.bounding.top * IMAGE_TO_SCREEN_Y
          }
        };
      }

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