from django.core.management.base import BaseCommand
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from patrol.models import Intersection, PatrolRoute, Route, PatrolRoutineTable
from django.core.exceptions import MultipleObjectsReturned
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import joblib
import logging
import random

