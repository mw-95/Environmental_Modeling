// This short script computes the mean Chlorophyll-a content, Sea Surface Temperature,
// Sea Surface Salinity, Ocean current speeds in u and v direction and Sea Surface Height anomalies for
// the months of January to March for a given year (End of polar summer in Antarctica, with minimal extent of sea ice).

// The resulting images are reprojected to a polar stereographic projection (EPSG:3031) and resampled
// to a common 4km grid. Afterwards, they are exported to the users Google Drive storage.

// Used Datasets are: MODIS Terra/Aqua Ocean Color SMI [NASA/OCEANDATA/MODIS-Terra/L3SMI] (Chl-a, SST)
//                    HYCOM (Hybrid Coordinate Ocean Model) [HYCOM/...] (SSS, Ocean Currents, SHA)

// The resulting datasets are used for modeling Krill- and Blue whale populations around the Antarctic.
// This is a project in the course "Spatial Modeling and Prediction" (04-GEO-MET-1), Summer Semester 2020 

// This script was written by Marius Witt, EAGLE M.Sc. Student at Würzburg University
// Contact: marius.witt@stud-mail.uni-wuerzburg.de
// Version 0.1, 23.06.2020


// We are going to use the antarctic polar sterographic projection (EPSG:3031)
var proj = ee.Projection('EPSG:3031');

// Define a region for the export of files // Polygon should have same crs as the used one!
var polygon = ee.FeatureCollection("users/wittmarius8/Antarctica_Circle_EPSG3031").geometry();

// Define the Months (Start/Stop)
var start = 1;
var stop = 3;

// Define a year (2000-2016)
var year = 2012;
var year_prefix = '2012_';
print(year_prefix);

// Define the output resolution (in m)
var res = 4000;

// Mean salinity 
var saline = ee.ImageCollection("HYCOM/sea_temp_salinity")
                .filter(ee.Filter.calendarRange(start,stop,'month'))
                .filter(ee.Filter.calendarRange(year,year,'year'))
                .select('salinity_0');

var saline_mean = saline
                 .reduce(ee.Reducer.mean())
                 .reproject(proj, null, res);

print(saline_mean, 'saline_mean');

// Mean Chl_a and Sea surface temperature
var mod21 = ee.ImageCollection("NASA/OCEANDATA/MODIS-Terra/L3SMI")
            .filter(ee.Filter.calendarRange(start,stop,'month'))
            .filter(ee.Filter.calendarRange(year,year,'year'))
            .select(['chlor_a', 'sst']);

var chlor_a_mean = mod21
                  .select('chlor_a')
                  .reduce(ee.Reducer.mean())
                  .reproject(proj, null, res);

var sst_mean = mod21
              .select('sst')
              .reduce(ee.Reducer.mean())
              .reproject(proj,null,res);

print(chlor_a_mean, 'chlor_a_mean');
print(sst_mean, 'sst_mean');

// Mean sea surface elevation
var elevation = ee.ImageCollection("HYCOM/sea_surface_elevation")
                .filter(ee.Filter.calendarRange(start,stop,'month'))
                .filter(ee.Filter.calendarRange(year,year,'year'));

var elevation_mean = elevation
                    .reduce(ee.Reducer.mean())
                    .reproject(proj, null, res);

print(elevation_mean, 'elevation_mean');

// Mean current speeds (East/North)
var velocity = ee.ImageCollection("HYCOM/sea_water_velocity")
                .filter(ee.Filter.calendarRange(start,stop,'month'))
                .filter(ee.Filter.calendarRange(year,year,'year'))
                .select(['velocity_u_0', 'velocity_v_0']);

var v0_mean = velocity
             .select('velocity_v_0')
             .reduce(ee.Reducer.mean())
             .reproject(proj, null, res);

var u0_mean = velocity
             .select('velocity_u_0')
             .reduce(ee.Reducer.mean())
             .reproject(proj,null,res);

print(v0_mean, 'v0_mean');
print(u0_mean, 'u0_mean');



// This line is run only once, to get a Bathymetric DEM, resampled to a 4km grid.
//var bathymetry = ee.Image('NOAA/NGDC/ETOPO1').select('bedrock').reproject(proj, null, 4000);


// Export the images, specifying scale and region.

Export.image.toDrive({
  image: saline_mean,
  description: 'Salinity',
  fileNamePrefix: year_prefix,
  scale: res,
  region: polygon,
});

Export.image.toDrive({
  image: chlor_a_mean,
  description: 'Chlorophyll-a',
  fileNamePrefix: year_prefix,
  scale: res,
  region: polygon,
});
Export.image.toDrive({
  image: sst_mean,
  description: 'Sea_Surface_Temp',
  fileNamePrefix: year_prefix,
  scale: res,
  region: polygon,
});
Export.image.toDrive({
  image: elevation_mean,
  description: 'Elevation',
  fileNamePrefix: year_prefix,
  scale: res,
  region: polygon,
});
Export.image.toDrive({
  image: v0_mean,
  description: 'V0',
  fileNamePrefix: year_prefix,
  scale: res,
  region: polygon,
});
Export.image.toDrive({
  image: u0_mean,
  description: 'U0',
  fileNamePrefix: year_prefix,
  scale: res,
  region: polygon,
});

// Bathymetry Export was only run once
//Export.image.toDrive({
//  image: bathymetry,
//  description: 'bathymetry',
//  scale: 4000,
//  region: polygon,
//});
