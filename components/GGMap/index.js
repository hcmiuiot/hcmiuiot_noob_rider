import React, {Component} from 'react';

import {View, StyleSheet, Text, Image} from 'react-native';

import Constants from '../../services/Constants';
import Sound from '../../services/Sound';

import MapView, {Marker} from 'react-native-maps';

import {requestGeolocationPermission} from '../../services/Permission';
import Geolocation from 'react-native-geolocation-service';
import haversine from 'haversine-distance';

import update from 'immutability-helper';

export default class index extends Component {
  constructor(props) {
    super(props);

    this.state = {
      myGPS: {
        coord: {latitude: 10.8381656, longitude: 106.6302742},
        heading: 0,
        speed: 0,
      },
      teammates: [],
      marks: [],
    };
  }

  centerMap(force = false) {
    // this.cautionPolice();
    if (this.mapView) {
      if (force || this.state.isFollowUser) {
        let camera = {
          center: this.state.myGPS.coord,
          pitch: this.mapView.getCamera().pitch,
          heading: this.state.myGPS.heading,
          // Only on iOS MapKit, in meters. The property is ignored by Google Maps.
          altitude: 0,
          // Only when using Google Maps.
          // zoom: number
        };
        if (this.state.myGPS.speed < 5) {
          this.mapView.animateToCoordinate(this.state.myGPS.coord, 500);
        } else {
          this.mapView.animateCamera(camera, 500);
        }
      }
      // this.mapView.fitToElements(true);
    }
  }

  findTeammateIndexByPhoneId(phoneId) {
    return this.state.teammates.findIndex(teammate => {
      return teammate.phoneId === phoneId;
    });
  }

  handleGps(phoneId, msg) {
    if (msg.timestamp && Date.now() - msg.timestamp <= Constants.MAX_AGE) {
      let foundIdx = this.findTeammateIndexByPhoneId(phoneId);
      let newGpsPacket = {phoneId, ...msg};
      if (foundIdx === -1) {
        this.setState({
          teammates: update(this.state.teammates, {$push: [newGpsPacket]}),
        });
      } else {
        this.setState({
          teammates: update(this.state.teammates, {
            [foundIdx]: {$set: newGpsPacket},
          }),
        });
      }

      this.setState({
        teammates: this.state.teammates.filter(teammate => {
          return Date.now() - teammate.timestamp <= Constants.MAX_AGE;
        }),
      });
    }
  }

  handleMark(phoneId, msg) {
    if (msg.timestamp && Date.now() - msg.timestamp <= Constants.MAX_MARK_AGE) {
      let newMarkPacket = {phoneId, ...msg};
      switch (newMarkPacket.markType) {
        case 'police': {
          Sound.play(Sound.CORTADO);
          break;
        }
        case 'accident': {
          Sound.play(Sound.OH_HELL_NO);
          break;
        }
        case 'petro': {
          Sound.play(Sound.SELFIE);
          break;
        }
      }

      this.setState({
        marks: update(this.state.marks, {$push: [newMarkPacket]}),
      });
    }
  }

  onMapReadyEvent = () => {
    if (requestGeolocationPermission()) {
      Geolocation.watchPosition(
        async position => {
          await this.setState({
            myGPS: {
              coord: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              heading: position.coords.heading,
              speed:
                position.coords.speed && position.coords.speed > 0.83
                  ? (position.coords.speed * 3.6).toFixed(2)
                  : 0,
            },
          });

          //   this.cautionPolice();
          this.try2SendGps();
          this.centerMap();
        },
        error => {},
        {
          enableHighAccuracy: true,
          distanceFilter: 3,
          interval: 3000,
          fastestInterval: 2000,
          forceRequestLocation: true,
        },
      );
    }
  };

  cautionPolice() {
    let polices = this.state.marks.filter(mark => {
      return mark.markType === 'police';
    });

    polices.map(police => {
      let ourGps = {
        lat: this.state.myGPS.coord.latitude,
        lon: this.state.myGPS.coord.longitude,
      };
      let copGps = {lat: police.coord.latitude, lon: police.coord.longitude};
      let distance = haversine(ourGps, copGps);

      if (distance <= Constants.POLICE_CAUTION_DISTANCE) {
        this.setState({
          msg: `Carefully nearby POLICE! (${(distance / 1000).toFixed(1)} km)`,
        });
      }
    });
  }

  try2SendGps() {
    if (this.props.mqttService && this.props.mqttService.isConnected()) {
      console.log('Trying 2 send GPS');

      this.props.mqttService.publish(
        Constants.PATTERN_TOPIC_GPS(this.props.phoneId),
        JSON.stringify({
          timestamp: Date.now(),
          user: this.props.user,
          ...this.state.myGPS,
        }),
        () => {
          console.log('Send GPS ok!');
        },
        {qos: 1, retain: true},
      );
    }
  }

  try2SendMark(markType) {
    if (this.props.mqttService && this.props.mqttService.isConnected()) {
      console.log('Trying 2 send Mark');

      this.props.mqttService.publish(
        Constants.PATTERN_TOPIC_MARK(this.props.phoneId + Date.now()),
        JSON.stringify({
          timestamp: Date.now(),
          markType,
          ...this.state.myGPS,
        }),
        () => {
          console.log('Send Mark ok!');
        },
        {qos: 1, retain: true},
      );
    }
  }

  render() {
    return (
      <MapView
        style={[StyleSheet.absoluteFillObject]}
        initialRegion={{
          latitude: 10.8777063,
          longitude: 106.8006299,
          latitudeDelta: 0.03,
          longitudeDelta: 0.02,
        }}
        ref={ref => {
          this.mapView = ref;
        }}
        onMapReady={this.onMapReadyEvent}
        loadingEnabled={true}
        // showsTraffic={true}
        showsCompass={false}>
        {Constants.SETTING_SHOW_CAUTION &&
          this.state.marks.map(
            mark =>
              mark.coord && (
                <Marker
                  coordinate={mark.coord}
                  image={
                    mark.markType === 'police'
                      ? require('../../assets/icons/police-officer.png')
                      : mark.markType === 'petro'
                      ? require('../../assets/icons/petro.png')
                      : require('../../assets/icons/car-accident2.png')
                  }
                  rotation={mark.heading}
                  // flat={true}
                  opacity={0.9}
                  // title={mark.user.riderName}
                />
              ),
          )}

        {/* {Constants.SETTING_SHOW_TEAMMATE &&
          this.state.teammates.map(
            teammate =>
              teammate.phoneId !== this.state.phoneId &&
              teammate.coord && (
                <Marker
                  coordinate={teammate.coord}
                  // rotation={teammate.heading}
                  // flat={true}
                  opacity={0.9}
                />
              ),
          )} */}

        {Constants.SETTING_SHOW_TEAMMATE &&
          this.state.teammates.map(
            teammate =>
              teammate.phoneId !== this.props.phoneId && teammate.user &&
              teammate.coord && (
                <Marker
                  coordinate={teammate.coord}
                  // rotation={teammate.heading}
                  // flat={true}
                  opacity={0.9}
                  anchor={{x: 0.105, y: 0.8}}>
                  <View style={style.marker}>
                    <View>
                      <Image
                        source={require('../../assets/icons/car.png')}
                        style={style.markerIcon}
                      />
                    </View>
                    <View style={[style.markerTooltip, {width: 120}]}>
                      <Text style={{fontWeight: 'bold'}}>
                        {teammate.user.riderName}
                      </Text>
                      <Text>{teammate.user.bikeName}</Text>
                      <Text>{teammate.speed} km/h</Text>
                    </View>
                  </View>
                </Marker>
              ),
          )}

        {/* <Marker
          coordinate={this.state.myGPS.coord}
          rotation={this.state.myGPS.heading}
          flat={true}
          opacity={0.9}
        /> */}
        <Marker
          coordinate={this.state.myGPS.coord}
          rotation={this.state.myGPS.heading}
          flat={true}
          opacity={0.9}
          ref={ref => {
            this.a = ref;
          }}
          anchor={{x: 0.17, y: 0.9}}>
          <View style={style.marker}>
            <View>
              <Image
                source={require('../../assets/icons/navigation.png')}
                style={style.markerIcon}
              />
            </View>
            <View style={style.markerTooltip}>
              <Text style={{fontWeight: 'bold'}}>You</Text>
              <Text>{this.state.myGPS.speed} km/h</Text>
            </View>
          </View>
        </Marker>
      </MapView>
    );
  }
}

const style = StyleSheet.create({
  marker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    width: 40,
    height: 40,
  },
  teammateIcon: {
    width: 35,
    height: 35,
  },
  markerTooltip: {
    marginLeft: 5,
    borderRadius: 15,
    padding: 5,
    width: 75,
    backgroundColor: '#cfcfcfBB',
  },
});
