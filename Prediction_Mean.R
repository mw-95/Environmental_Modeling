# Short script to Model the habitat suitability for Humpback whales
# around Antarctica from January to March. 

# This script uses Maxent and BRT distribution models.
# For a more representative result, the pseudo-absence data is generated 10 times, and the mean
# of 10 BRT runs is taken as result. 
# Paper this is based on: https://besjournals.onlinelibrary.wiley.com/doi/pdf/10.1111/j.2041-210X.2011.00172.x
# Helpful video explaining the sdm package: https://www.youtube.com/watch?v=wLGanYOLzV8&t=1371s

# Created for the Spatial Distribution Modeling course in Summer 2020.

# Created by Marius Witt
# 22.07.2020
# M.Sc. EAGLE, University of Würzburg

library(raster)
library(sp)
library(rgdal)
library(dplyr)
library(usdm)
library(sdm)

setwd("G:/EAGLE_Master/2_Semester/GEE_Modelling/Mean_2000_2016/January/")

# Load in Background Landmask
#bg_mask <- raster("D:/EAGLE_Master/2_Semester/GEE_Modelling/Mean_2000_2016/Water_Bg_Mask.tif")

# Create Raster Stack from all predictor variables
list <- list.files("./", "*.tif")
predictors <- lapply(list,raster) %>%
  stack()

# Load Humpback sightings shapefile
occ <- readOGR("G:/EAGLE_Master/2_Semester/GEE_Modelling/Humpback_Jan_Mar.shp")

# Subset the sightings shapefile to single months
occ_mon <- occ[occ$month == '1',]
occ_mon$species <- 1
occ_mon <- occ_mon[,c('species')]

# Check for colinearity in the predictor variables
vif_pred <- vif(predictors)
cor_pred <- vifcor(predictors, th = 0.7)

# Exclude colinear variables from our model input 
predictors_decor <- exclude(predictors, cor_pred) %>% brick()

# Using the sdm package
d <- sdmData(species~., occ_mon, predictors = predictors_decor, bg = list(n = 128))

# Create a sdm model
m <- sdm(species~., d, methods = c('brt'),
         replication=c('boot'),n=10)

# Evaluate the sdm model, for AUC / TSS  and best treshold
ev <- getEvaluation(m, stat = c('AUC', 'TSS', 'treshold'), opt = 2)
mean_ev <- mean(ev$threshold)
mean(ev$AUC)
mean(ev$TSS)

# Predict a probabilty map
p <- predict(m, predictors_decor, mean = T)
plot(p)

# Create a suitable occurence map from probability and treshold
pa <- raster(p)
pa[] <- ifelse(p[] >= mean_ev, 1, 0)
plot(pa)

# Write results
writeRaster(p,"Jan_brt_prob.tif")
writeRaster(pa,"Jan_brt_occ.tif")










