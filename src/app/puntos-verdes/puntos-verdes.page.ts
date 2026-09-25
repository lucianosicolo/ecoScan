/// <reference types="google.maps" />

import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import {
  Geolocation,
} from '@capacitor/geolocation';

import {
  ToastController,
} from '@ionic/angular';


type MaterialType =
  | 'all'
  | 'plastic'
  | 'glass'
  | 'metal'
  | 'paper'
  | 'cardboard';


interface RecyclingPoint {
  id: number;

  name: string;

  address: string;

  latitude: number | null;

  longitude: number | null;

  materials: MaterialType[];

  schedule: string;

  open: boolean | null;

  distance: number | null;
}


@Component({
  selector: 'app-puntos-verdes',

  templateUrl:
    './puntos-verdes.page.html',

  styleUrls: [
    './puntos-verdes.page.scss',
  ],

  standalone: false,
})
export class PuntosVerdesPage
  implements AfterViewInit {

  @ViewChild('map')
  mapElement!:
    ElementRef<HTMLDivElement>;


  hasUserLocation = false;

  loadingLocation = false;


  searchTerm = '';

  selectedMaterial:
    MaterialType = 'all';

  selectedPoint:
    RecyclingPoint | null = null;


  private map!:
    google.maps.Map;

  private infoWindow!:
    google.maps.InfoWindow;

  private geocoder!:
    google.maps.Geocoder;


  private markers:
    google.maps.marker
    .AdvancedMarkerElement[] = [];


  private userMarker:
    google.maps.marker
    .AdvancedMarkerElement | null =
    null;


  userPosition = {
    latitude: -38.9339,

    longitude: -67.9903,
  };


  materialFilters = [
    {
      label: 'Todos',

      value:
        'all' as MaterialType,

      icon:
        'apps-outline',
    },

    {
      label: 'Plástico',

      value:
        'plastic' as MaterialType,

      icon:
        'water-outline',
    },

    {
      label: 'Vidrio',

      value:
        'glass' as MaterialType,

      icon:
        'wine-outline',
    },

    {
      label: 'Latas',

      value:
        'metal' as MaterialType,

      icon:
        'beaker-outline',
    },

    {
      label: 'Papel',

      value:
        'paper' as MaterialType,

      icon:
        'document-outline',
    },

    {
      label: 'Cartón',

      value:
        'cardboard' as MaterialType,

      icon:
        'cube-outline',
    },
  ];


  /*
   * Puntos Limpios de Cipolletti.
   * Las coordenadas se obtienen
   * automáticamente mediante
   * Google Geocoding.
   */
  recyclingPoints:
    RecyclingPoint[] = [

      {
        id: 1,

        name:
          'Punto Limpio Barrio Manzanar',

        address:
          'Los Cipreses y Maipú, Cipolletti, Río Negro',

        latitude: null,

        longitude: null,

        materials: [
          'plastic',
          'glass',
          'metal',
          'paper',
          'cardboard',
        ],

        schedule: '',

        open: null,

        distance: null,
      },


      {
        id: 2,

        name:
          'Punto Limpio Parque Norte',

        address:
          'Antonio Turrín y La Esmeralda, Cipolletti, Río Negro',

        latitude: null,

        longitude: null,

        materials: [
          'plastic',
          'glass',
          'metal',
          'paper',
          'cardboard',
        ],

        schedule: '',

        open: null,

        distance: null,
      },


      {
        id: 3,

        name:
          'Punto Limpio DVNe',

        address:
          'Domingo Savio y Las Jarillas, Cipolletti, Río Negro',

        latitude: null,

        longitude: null,

        materials: [
          'plastic',
          'glass',
          'metal',
          'paper',
          'cardboard',
        ],

        schedule: '',

        open: null,

        distance: null,
      },


      {
        id: 4,

        name:
          'Punto Limpio Ferri',

        address:
          'San Luis y Los Rosales, Ferri, Cipolletti, Río Negro',

        latitude: null,

        longitude: null,

        materials: [
          'plastic',
          'glass',
          'metal',
          'paper',
          'cardboard',
        ],

        schedule: '',

        open: null,

        distance: null,
      },


      {
        id: 5,

        name:
          'Punto Limpio Correo Argentino',

        address:
          'Mengelle y Teniente Ibáñez, Cipolletti, Río Negro',

        latitude: null,

        longitude: null,

        materials: [
          'plastic',
          'glass',
          'metal',
          'paper',
          'cardboard',
        ],

        schedule: '',

        open: null,

        distance: null,
      },
    ];


  filteredPoints:
    RecyclingPoint[] = [];


  constructor(
    private readonly toastController:
      ToastController,
  ) {

    this.filteredPoints = [
      ...this.recyclingPoints,
    ];
  }


  async ngAfterViewInit():
    Promise<void> {

    try {

      await this.waitForGoogleMaps();

      await this.initializeMap();

    } catch (error: unknown) {

      console.error(
        'Error cargando Google Maps:',
        error,
      );

      await this.showLocationError(
        'No se pudo cargar el mapa. ' +
        'Intentá nuevamente.',
      );
    }
  }


  private async waitForGoogleMaps():
    Promise<void> {

    const maxAttempts = 100;

    const delay = 100;


    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {

      if (
        typeof google !==
        'undefined' &&

        google.maps &&

        typeof google.maps
          .importLibrary ===
        'function'
      ) {

        return;
      }


      await new Promise<void>(
        (
          resolve,
        ) => {

          setTimeout(
            resolve,
            delay,
          );
        },
      );
    }


    throw new Error(
      'Google Maps no terminó de cargar.',
    );
  }


  private async initializeMap():
    Promise<void> {

    const {
      Map,
    } =
      await google.maps
        .importLibrary(
          'maps',
        ) as google.maps.MapsLibrary;


    const {
      Geocoder,
    } =
      await google.maps
        .importLibrary(
          'geocoding',
        ) as google.maps
        .GeocodingLibrary;


    this.geocoder =
      new Geocoder();


    this.infoWindow =
      new google.maps.InfoWindow();


    this.map =
      new Map(
        this.mapElement
          .nativeElement,

        {
          center: {
            lat:
              this.userPosition
                .latitude,

            lng:
              this.userPosition
                .longitude,
          },

          zoom: 13,

          mapId:
            'DEMO_MAP_ID',

          disableDefaultUI:
            true,

          zoomControl:
            true,
        },
      );


    await this
      .resolvePointCoordinates();


    await this
      .renderMarkers();
  }


  private async resolvePointCoordinates():
    Promise<void> {

    for (
      const point
      of this.recyclingPoints
    ) {

      if (
        point.latitude !== null &&
        point.longitude !== null
      ) {

        continue;
      }


      try {

        const response =
          await this.geocoder
            .geocode({
              address:
                `${point.address}, Argentina`,
            });


        const result =
          response.results[0];


        if (!result) {

          console.warn(
            'No se encontraron coordenadas para:',
            point.name,
          );

          continue;
        }


        point.latitude =
          result.geometry
            .location
            .lat();


        point.longitude =
          result.geometry
            .location
            .lng();

      } catch (
      error: unknown
      ) {

        console.error(
          `Error geocodificando ${point.name}:`,
          error,
        );
      }
    }
  }


  private async showUserMarker():
    Promise<void> {

    if (!this.map) {
      return;
    }


    const {
      AdvancedMarkerElement,
    } =
      await google.maps
        .importLibrary(
          'marker',
        ) as google.maps
        .MarkerLibrary;


    if (this.userMarker) {

      this.userMarker.map =
        null;
    }


    const markerContent =
      document.createElement(
        'div',
      );


    markerContent.style.width =
      '20px';

    markerContent.style.height =
      '20px';

    markerContent.style.background =
      '#4285f4';

    markerContent.style.border =
      '4px solid #ffffff';

    markerContent.style.borderRadius =
      '50%';

    markerContent.style.boxShadow =
      '0 2px 8px rgba(0, 0, 0, 0.35)';


    this.userMarker =
      new AdvancedMarkerElement({
        map:
          this.map,

        position: {
          lat:
            this.userPosition
              .latitude,

          lng:
            this.userPosition
              .longitude,
        },

        title:
          'Tu ubicación',

        content:
          markerContent,

        zIndex:
          1000,
      });
  }


  private async renderMarkers():
    Promise<void> {

    if (!this.map) {
      return;
    }


    this.markers.forEach(
      (
        marker,
      ) => {

        marker.map = null;
      },
    );


    this.markers = [];


    const {
      AdvancedMarkerElement,
      PinElement,
    } =
      await google.maps
        .importLibrary(
          'marker',
        ) as google.maps
        .MarkerLibrary;


    this.filteredPoints
      .forEach(
        (
          point,
        ) => {

          if (
            point.latitude === null ||
            point.longitude === null
          ) {

            return;
          }


          const isSelected =
            this.selectedPoint?.id ===
            point.id;


          const pin =
            new PinElement({

              background:
                isSelected
                  ? '#c6f45d'
                  : '#25a865',

              borderColor:
                isSelected
                  ? '#147a48'
                  : '#ffffff',

              glyphColor:
                isSelected
                  ? '#147a48'
                  : '#ffffff',

              scale:
                isSelected
                  ? 1.2
                  : 1.05,
            });


          const marker =
            new AdvancedMarkerElement({

              map:
                this.map,

              position: {
                lat:
                  point.latitude,

                lng:
                  point.longitude,
              },

              title:
                point.name,

              content:
                pin.element,

              gmpClickable:
                true,

              zIndex:
                isSelected
                  ? 100
                  : 1,
            });


          marker.addEventListener(
            'gmp-click',
            () => {

              this.selectPoint(
                point,
              );


              const materials =
                point.materials
                  .map(
                    (
                      material,
                    ) =>
                      this
                        .getMaterialLabel(
                          material,
                        ),
                  )
                  .join(', ');


              this.infoWindow
                .setContent(`
                  <div
                    style="
                      max-width: 220px;
                      padding: 4px;
                    "
                  >
                    <strong
                      style="
                        font-size: 14px;
                      "
                    >
                      ${point.name}
                    </strong>

                    <p
                      style="
                        margin: 6px 0;
                        font-size: 11px;
                      "
                    >
                      ${point.address}
                    </p>

                    <span
                      style="
                        font-size: 10px;
                        color: #147a48;
                      "
                    >
                      Recibe:
                      ${materials}
                    </span>
                  </div>
                `);


              this.infoWindow.open({
                map:
                  this.map,

                anchor:
                  marker,
              });
            },
          );


          this.markers.push(
            marker,
          );
        },
      );
  }


  async centerOnUser():
    Promise<void> {

    if (
      this.loadingLocation
    ) {
      return;
    }


    this.loadingLocation =
      true;


    try {

      let permissions =
        await Geolocation
          .checkPermissions();


      if (
        permissions.location !==
        'granted'
      ) {

        permissions =
          await Geolocation
            .requestPermissions();
      }


      if (
        permissions.location !==
        'granted'
      ) {

        await this
          .showLocationError(
            'Necesitamos acceso a tu ubicación ' +
            'para mostrarte los puntos cercanos.',
          );

        return;
      }


      const position =
        await Geolocation
          .getCurrentPosition({

            enableHighAccuracy:
              true,

            timeout:
              12000,

            maximumAge:
              30000,
          });


      this.userPosition = {

        latitude:
          position.coords
            .latitude,

        longitude:
          position.coords
            .longitude,
      };


      this.hasUserLocation =
        true;


      const mapPosition = {

        lat:
          this.userPosition
            .latitude,

        lng:
          this.userPosition
            .longitude,
      };


      this.map.setCenter(
        mapPosition,
      );


      this.map.setZoom(
        14,
      );


      this.calculateDistances();


      await this
        .showUserMarker();


      await this
        .renderMarkers();

    } catch (
    error: unknown
    ) {

      console.error(
        'Error obteniendo ubicación:',
        error,
      );


      this.hasUserLocation =
        false;


      await this
        .showLocationError(
          'No pudimos obtener tu ubicación. ' +
          'Verificá que el GPS esté activado.',
        );

    } finally {

      this.loadingLocation =
        false;
    }
  }


  private async showLocationError(
    message: string,
  ): Promise<void> {

    const toast =
      await this.toastController
        .create({

          message,

          duration:
            2500,

          color:
            'danger',

          position:
            'bottom',
        });


    await toast.present();
  }


  selectMaterial(
    material: MaterialType,
  ): void {

    this.selectedMaterial =
      material;


    this.filterPoints();
  }


  filterPoints():
    void {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    this.filteredPoints =
      this.recyclingPoints
        .filter(
          (
            point,
          ) => {

            const matchesText =
              !search ||

              point.name
                .toLowerCase()
                .includes(
                  search,
                ) ||

              point.address
                .toLowerCase()
                .includes(
                  search,
                );


            const matchesMaterial =
              this.selectedMaterial ===
              'all' ||

              point.materials
                .includes(
                  this.selectedMaterial,
                );


            return (
              matchesText &&
              matchesMaterial
            );
          },
        );


    const selectedStillVisible =
      this.filteredPoints
        .some(
          (
            point,
          ) =>
            point.id ===
            this.selectedPoint?.id,
        );


    if (
      !selectedStillVisible
    ) {

      this.selectedPoint =
        null;


      this.infoWindow
        ?.close();
    }


    void this
      .renderMarkers();
  }


  clearSearch():
    void {

    this.searchTerm =
      '';


    this.filterPoints();
  }


  selectPoint(
    point: RecyclingPoint,
  ): void {

    if (
      point.latitude === null ||
      point.longitude === null
    ) {

      return;
    }


    this.selectedPoint =
      point;


    this.map.panTo({
      lat:
        point.latitude,

      lng:
        point.longitude,
    });


    this.map.setZoom(
      15,
    );


    void this
      .renderMarkers();
  }


  orderByDistance():
    void {

    if (
      !this.hasUserLocation
    ) {
      return;
    }


    this.filteredPoints = [
      ...this.filteredPoints,
    ].sort(
      (
        firstPoint,
        secondPoint,
      ) =>

        (
          firstPoint.distance ??
          Infinity
        ) -

        (
          secondPoint.distance ??
          Infinity
        ),
    );
  }


  getMaterialLabel(
    material: MaterialType,
  ): string {

    const labels:
      Record<
        MaterialType,
        string
      > = {

      all:
        'Todos',

      plastic:
        'Plástico',

      glass:
        'Vidrio',

      metal:
        'Latas',

      paper:
        'Papel',

      cardboard:
        'Cartón',
    };


    return labels[
      material
    ];
  }


  viewDetails(
    point: RecyclingPoint,
    event: Event,
  ): void {

    event.stopPropagation();


    this.selectPoint(
      point,
    );
  }


  openDirections(
    point: RecyclingPoint,
    event: Event,
  ): void {

    event.stopPropagation();


    const destination =

      point.latitude !== null &&
        point.longitude !== null

        ? `${point.latitude},${point.longitude}`

        : `${point.address}, Argentina`;


    const url =

      'https://www.google.com/maps/dir/?api=1' +

      `&destination=${encodeURIComponent(
        destination,
      )
      }`;


    window.open(
      url,

      '_blank',

      'noopener,noreferrer',
    );
  }


  private calculateDistances():
    void {

    this.recyclingPoints
      .forEach(
        (
          point,
        ) => {

          if (
            point.latitude === null ||
            point.longitude === null
          ) {

            point.distance =
              null;

            return;
          }


          point.distance =
            this.getDistanceInKm(

              this.userPosition
                .latitude,

              this.userPosition
                .longitude,

              point.latitude,

              point.longitude,
            );
        },
      );
  }


  private getDistanceInKm(
    latitudeOne: number,

    longitudeOne: number,

    latitudeTwo: number,

    longitudeTwo: number,
  ): number {

    const earthRadius =
      6371;


    const latitudeDifference =
      this.toRadians(
        latitudeTwo -
        latitudeOne,
      );


    const longitudeDifference =
      this.toRadians(
        longitudeTwo -
        longitudeOne,
      );


    const calculation =

      Math.sin(
        latitudeDifference /
        2,
      ) ** 2 +

      Math.cos(
        this.toRadians(
          latitudeOne,
        ),
      ) *

      Math.cos(
        this.toRadians(
          latitudeTwo,
        ),
      ) *

      Math.sin(
        longitudeDifference /
        2,
      ) ** 2;


    return (
      earthRadius *

      2 *

      Math.atan2(
        Math.sqrt(
          calculation,
        ),

        Math.sqrt(
          1 -
          calculation,
        ),
      )
    );
  }


  private toRadians(
    value: number,
  ): number {

    return (
      value *
      Math.PI /
      180
    );
  }
}