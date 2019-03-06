import React, {Component} from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { ImageCropper } from 'react-native-gl-image-cropper';


export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      image: 'https://images.unsplash.com/photo-1551741520-d8a61f499d25?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60',
      height: 200,
      width: 300,
      zoom: 0,
      showNew: true,
      newImage: 'https://images.unsplash.com/photo-1551741520-d8a61f499d25?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60',
    };
  }

  render() {
    return (
      
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <ImageCropper
            ref={(ref) => {this.cropper = ref;}}
            image={this.state.image}
            cropHeight={this.state.height}
            cropWidth={this.state.width}
            maxZoom={80}
            minZoom={0}
            panToMove={true}
            pinchToZoom={true}
          />
          <View style={{flex: 1, marginTop: 20}}>
            <TouchableOpacity onPress={this.capture}>
              <Text style={{color: "gray", padding: 10 }}>CAPTURE</Text>
            </TouchableOpacity>

            <Image source={{ uri: this.state.newImage }} style={{height: this.state.height, width: this.state.width}} />

          </View>
        </View>
      
    );
  }
  capture = () => {
    this.cropper.crop()
    .then(res =>{
      this.setState({
        showNew: true,
        newImage: res,
      });
    })
  }
}

