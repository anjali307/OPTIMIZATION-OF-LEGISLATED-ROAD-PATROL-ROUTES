from .imports import *

# ======== INTERACTING WITH THE DATABASE ==========
# ====== Dashboard Data ======
def dashboard_data(request):
    total_routes = RoadSegment.objects.count()
    predicted_routes = PredictedRoute.objects.count()
    total_routes_percentage = (total_routes / RoadSegment.objects.count()) * 100  
    predicted_routes_percentage = (predicted_routes / PredictedRoute.objects.count()) * 100  
    data = {
        'totalRoutes': total_routes,
        'predictedRoutes': predicted_routes,
        'totalRoutesPercentage': total_routes_percentage,
        'predictedRoutesPercentage': predicted_routes_percentage,
    }
    return JsonResponse(data)

# ====== Road Intersections ======
@require_GET
def get_intersections(request):
    street_name = request.GET.get('street_name')
    
    if not street_name:
        return JsonResponse({'error': 'Street name parameter is missing'}, status=400)
    
    road_segments = RoadSegment.objects.filter(st_name=street_name)
    
    if not road_segments.exists():
        return JsonResponse({'error': 'No road segments found for the given street name'}, status=404)
    
    intersections = [
        {
            'from_intersection': segment.from_intersection.name,
            'to_intersection': segment.to_intersection.name,
            'ptrl_freq': segment.ptrl_freq  
        }
        for segment in road_segments
    ]
    
    return JsonResponse(intersections, safe=False)

# Load data from Excel file
def load_data(file_path, sheet_name='Road Information.shp'):
    return pd.read_excel(file_path, sheet_name=sheet_name)

# Preprocess the data, fill NaN 
def preprocess_data(data):
    data.fillna(0, inplace=True)
    data['Length'] = data['Length'].astype(float)
    data['AADT'] = data['AADT'].astype(int)
    data['Speed_Lmt'] = data['Speed_Lmt'].astype(int)
    data['SNW_ACC_D'] = data['SNW_ACC_D'].astype(float)
    data['SNW_ACC_T'] = data['SNW_ACC_T'].astype(float)
    data['ICE_TIME'] = data['ICE_TIME'].astype(float)
    data['NumLanes'] = data['NumLanes'].astype(int)
    data['LaneKM'] = data['LaneKM'].astype(float)
    return data

# Extract frequency and interval from the patrol frequency string
def extract_frequency_days(freq_str):
    if pd.isna(freq_str):
        return (np.nan, np.nan)
    try:
        tokens = freq_str.split()
        if "Once" in tokens:
            interval = int(tokens[-2])
            return (1, interval)
        elif "times" in tokens:
            frequency = int(tokens[0])
            interval = int(tokens[-2])
            return (frequency, interval)
        else:
            return (np.nan, np.nan)
    except (ValueError, IndexError):
        return (np.nan, np.nan)

# Prepare features 
def prepare_features(data, selected_features, categorical_features):
    encoder = OneHotEncoder()
    encoded_categorical = encoder.fit_transform(data[categorical_features]).toarray()
    features = np.hstack((data[selected_features].values, encoded_categorical))
    return features, encoder, data[categorical_features]

# Prepare target variables for frequency and interval
def prepare_targets(data):
    target_frequency = data.apply(lambda x: x[0])
    target_interval = data.apply(lambda x: x[1])
    return target_frequency, target_interval

# Train and evaluate the linear regression models for frequency and interval
def train_evaluate_model(X_train, y_train_freq, y_train_interval, X_test, y_test_freq, y_test_interval, model_freq=None, model_interval=None):
    if model_freq is None:
        model_freq = LinearRegression()
    model_freq.fit(X_train, y_train_freq)
    y_pred_freq = model_freq.predict(X_test)
    
    if model_interval is None:
        model_interval = LinearRegression()
    model_interval.fit(X_train, y_train_interval)
    y_pred_interval = model_interval.predict(X_test)
    
    y_pred_freq = np.maximum(y_pred_freq, 1)
    y_pred_interval = np.maximum(y_pred_interval, 1)
    
    y_pred = np.column_stack((y_pred_freq, y_pred_interval))
    
    metrics = {
        'MAE': mean_absolute_error(np.column_stack((y_test_freq, y_test_interval)), y_pred),
        'MSE': mean_squared_error(np.column_stack((y_test_freq, y_test_interval)), y_pred),
        'R2': r2_score(np.column_stack((y_test_freq, y_test_interval)), y_pred)
    }

    return (model_freq, model_interval), y_pred, metrics

# Helper function to generate plot as image data
def get_plot_image(y_test_freq, y_pred_freq, y_test_interval, y_pred_interval):
    plt.figure(figsize=(6, 5))
    plt.scatter(y_test_freq, y_pred_freq, alpha=0.7)
    plt.plot([min(y_test_freq), max(y_test_freq)], [min(y_test_freq), max(y_test_freq)], color='red', linewidth=2)
    plt.xlabel('Actual Frequency')
    plt.ylabel('Predicted Frequency')
    plt.title('Actual vs Predicted Patrol Frequency')

    buffer_freq = BytesIO()
    plt.savefig(buffer_freq, format='png')
    plt.close()
    buffer_freq.seek(0)
    image_base64_freq = base64.b64encode(buffer_freq.getvalue()).decode('utf-8')
    buffer_freq.close()

    plt.figure(figsize=(6, 5))
    plt.scatter(y_test_interval, y_pred_interval, alpha=0.7)
    plt.plot([min(y_test_interval), max(y_test_interval)], [min(y_test_interval), max(y_test_interval)], color='red', linewidth=2)
    plt.xlabel('Actual Interval')
    plt.ylabel('Predicted Interval')
    plt.title('Actual vs Predicted Patrol Interval')

    buffer_interval = BytesIO()
    plt.savefig(buffer_interval, format='png')
    plt.close()
    buffer_interval.seek(0)
    image_base64_interval = base64.b64encode(buffer_interval.getvalue()).decode('utf-8')
    buffer_interval.close()

    return image_base64_freq, image_base64_interval