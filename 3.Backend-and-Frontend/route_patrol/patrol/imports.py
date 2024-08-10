from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from .models import PatrolRoutineTable, PatrolRoute, Route
from django.views.decorators.http import require_GET
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout as auth_logout
from django.core.files.storage import default_storage
from django.utils.cache import patch_cache_control
from django.utils.html import json_script
from django.contrib.auth import update_session_auth_hash
from django.conf import settings
import mimetypes
import pandas as pd
import matplotlib
from django.contrib import messages
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from datetime import datetime
from django.utils.timezone import now
from io import BytesIO
import base64
import numpy as np
import json
import time
import os
import joblib
