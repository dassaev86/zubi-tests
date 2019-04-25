import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Form, Label, Item, Input, Button, Icon } from 'native-base';
import { ImagePicker, Permissions } from 'expo';
import MainHeader from './UI/Header';

import firebase from '../../firebase/config';
import 'firebase/firestore';
import { ScrollView } from 'react-native-gesture-handler';

import ImageBrowser from './UI/ImagePicker';


class NewItemTab extends Component {
  constructor(props) {
    super(props);
    this.db = firebase.firestore();
  };

  state = {
    name: '',
    desc: '',
    condition: '',
    image: null,
    mainImage: '',
    imageBrowserOpen: false,
    photos: []
  }

  imageBrowserCallback = (callback) => {
    callback.then((photos) => {
      console.log(photos[0].file)
      this.setState({
        imageBrowserOpen: false,
        mainImage: photos[0],
        photos
      })
    }).catch((e) => console.log(e))
  }

  renderImage(item, i) {
    return(
      <Image
        style={{height: 100, width: 100, marginLeft: 15}}
        source={{uri: item.file}}
        key={i}
      />
    )
  }

  selectPicture = async () => {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    const { cancelled, uri } = await ImagePicker.launchImageLibraryAsync({
      aspect: [4,3],
      allowsEditing: false
    });
    if (!cancelled) {
       this.setState({image: uri});
    };
  }

  takePicture = async () => {
    await Permissions.askAsync(Permissions.CAMERA);
    const { cancelled, uri } = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
    });
    if (!cancelled) {
      this.setState({image: uri});
   };
  }

  uploadImage = async (uri, imgName) => {
    const blob = await new Promise((resolve, reject) => {
        const xhr =  new XMLHttpRequest();
        xhr.onload = function() {
          alert('Subida correctamente');
          resolve(xhr.response);
        };
        xhr.onerror = function(e) {
          console.log('Error: ', e);
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
    });

    const ref = firebase.storage().ref('images/').child(imgName);
    const snapshot = await ref.put(blob);
    
    blob.close();
    return await snapshot.ref.getDownloadURL();
  }

  changeName = (name) => {
    this.setState({name});
  }

  changeDescription = (desc) => {
    this.setState({desc});
  }

  changeCondition = (condition) => {
    this.setState({condition});
  }

  publishItem = () => {
    if (this.state.name && this.state.desc && this.state.condition) {
      alert(`${this.state.name} - ${this.state.desc} - ${this.state.condition} `);
    } else {
      alert('Debe ingresar todos los datos');
      return;
    }

    this.uploadImage(this.state.image, this.state.name)
      .then((response) => {
        const date =  Date.now();
        this.db.collection('items').add({
          name: this.state.name,
          description: this.state.desc,
          condition: this.state.condition,
          date: date,
          imgs: response
        }).then((data) => {
          console.log(`Se agrego un nuevo item ${data}`);
          this.props.navigation.navigate('Home');
        }).catch((error) => {
          console.log(error);
        });
      })
      .done()
  }

  render() {
    if (this.state.imageBrowserOpen) {
      return(<ImageBrowser max={10} callback={this.imageBrowserCallback}/>);
    }

    const Picker = (
      <TouchableOpacity
      style={styles.pickerContainer}
      onPress={() => this.setState({imageBrowserOpen: true})}
      >
       <Image 
       source={require('../../assets/icon-add-images.png')}
       style={{height: 64.5, width: 64.5}}/>
       <Text style={{fontSize: 14, color: '#7E7E7E', marginTop: 15}}>Añadir Imágenes</Text>
     </TouchableOpacity>
    );
    const MainImage = (
      <Image
      style={{height: 319, width: '100%', marginBottom: 20}}
      source={{uri: this.state.mainImage.file}}
    />
    );

    const AddImages = (
      <TouchableOpacity
        style={styles.addImageContainer}
        onPress={() => this.setState({imageBrowserOpen: true})}
      >
       <Image 
          source={require('../../assets/icon-add-images.png')}
          style={{height: 42, width: 42}}
       />
      </TouchableOpacity>
    )
    return (
      <ScrollView>
        <MainHeader />
        {/* <Button bordered
            onPress={() => this.setState({imageBrowserOpen: true})}
            style={{margin: 50, width: 300, justifyContent: 'center'}}>
            <Text style={{fontSize: 30, textAlign: 'center', color: 'blue'}}>Images</Text>
          </Button> */}

          {this.state.photos.length < 1 ? Picker : MainImage}

        <ScrollView
         style={styles.imagesContainer}
         horizontal={true}
         showsHorizontalScrollIndicator={false}
         >
          {this.state.photos.map((item,i) => this.renderImage(item,i))}
          {this.state.photos.length > 0 && this.state.photos.length < 10 ? AddImages : null}
        </ScrollView>

        

        {/* <View>
          <Image source={{uri: this.state.image}} style={{height: 200, width: '80%', justifyContent:'center'}}/>
          <TouchableOpacity onPress={this.takePicture} style={{justifyContent: 'center'}}>
            <Icon name="ios-camera" />
          </TouchableOpacity>
          <TouchableOpacity onPress={this.selectPicture} style={{justifyContent: 'center'}}>
            <Icon name="ios-images" />
          </TouchableOpacity>
        </View> */}

        <Form>
          <Item floatingLabel>
            <Label>Nombre del Producto</Label>
            <Input 
            value={this.state.name}
            onChangeText = {(name) => this.changeName(name)}
             />
          </Item>

          <Item floatingLabel>
            <Label>Descripción</Label>
            <Input 
              value={this.state.desc}
              onChangeText = {(desc) => this.changeDescription(desc)}
            />
          </Item>

          <Item floatingLabel>
            <Label>Estado</Label>
            <Input
              value={this.state.condition}
              onChangeText = {(cond) => this.changeCondition(cond)}
            />
          </Item>

        </Form>

        <Button bordered
            onPress = {this.publishItem}
            style={{margin: 50, width: 300, justifyContent: 'center'}}>
            <Text style={{fontSize: 30, textAlign: 'center', color: 'blue'}}>Publicar</Text>
          </Button>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagesContainer: {
    display: 'flex',
   // width: '90%',
    flexDirection: 'row',
   // justifyContent: 'flex-start'
  },
  pickerContainer: {
    width: '100%',
    height: 313,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imagePicker: {
    flex: 0,
    backgroundColor: 'gray',
    width: 380,
    height: 200,
    margin: 20,
    justifyContent: 'center'
  },
  addImageContainer: {
    width: 100,
    height: 100,
    marginLeft: 15,
    marginRight: 15,
    backgroundColor: '#40505B',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default NewItemTab;