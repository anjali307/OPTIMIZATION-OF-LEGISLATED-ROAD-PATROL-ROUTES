from .imports import *
from .database import *
from .forms import *

# ======= READE/ADD/UPDATE/DELETE DATA =======
# ======== Versioning ========
def serve_static_file(request, path):
    file_path = default_storage.path(path)
    
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = 'application/octet-stream'

    with open(file_path, 'rb') as file:
        content = file.read()

    response = HttpResponse(content, content_type=mime_type)
    
    patch_cache_control(response, no_cache=True, no_store=True, must_revalidate=True)

    return response

# ====== Dashboard ======
def dashboard(request):
    if request.method == 'POST':
        st_name = request.POST.get('street-name')
        ptrl_freq = request.POST.get('patrol-frequency')
        start_date = request.POST.get('date')
        comments = request.POST.get('comment')

        if not start_date:
            start_date = datetime.now().date()

        if PatrolRoutineTable.objects.filter(st_name=st_name, ptrl_freq=ptrl_freq, start_date=start_date).exists():
            messages.error(request, 'A patrol entry with the same street name, patrol frequency, and start date already exists.')
        else:
            PatrolRoutineTable.objects.create(
                st_name=st_name,
                ptrl_freq=ptrl_freq,
                start_date=start_date,
                comments=comments
            )
            messages.success(request, 'Patrol entry added successfully.')

        return redirect('dashboard')
    
    routes = Route.objects.all()
    date_threshold = datetime(2024, 9, 1)
    patrol_routine_table = PatrolRoutineTable.objects.filter(start_date__gte=date_threshold).order_by('start_date')
    
    return render(request, 'patrol/dashboard.html', {
        'routes': routes,
        'patrol_routine_table': patrol_routine_table,
        'timestamp' : now().timestamp(),
    })

# ====== Dashboard Data ======
def dashboard_data(request):
    total_routes = PatrolRoute.objects.count()
    predicted_routes = PatrolRoutineTable.objects.count()
    
    data = {
        'totalRoutes': total_routes,
        'predictedRoutes': predicted_routes,
    }
    
    return JsonResponse(data)

# ====== Calendar ======
def calendar_view(request):
    calendar_entries = PatrolRoute.objects.all()
    entries_list = {
        "Route_A": [],
        "Route_B": [],
        "Route_C": [],
        "Route_D": []
    }
    for entry in calendar_entries:
        route_data = {
            "route": entry.route.name,
            "street_name": entry.street_name,
            "from_intersection": entry.from_intersection.name,
            "to_intersection": entry.to_intersection.name,
            "days": entry.days,
        }
        entries_list[entry.route.name].append(route_data)

    return render(request, 'patrol/calendar.html', {'calendar_entries': json.dumps(entries_list)})

# ==== Model ======
def model_view(request):    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dataset_dir = os.path.join(base_dir, 'route_patrol/patrol/dataset')
    road_segments_file = os.path.join(dataset_dir, 'road_information.xlsx')
    model_dir = os.path.join(base_dir, 'models')
    os.makedirs(model_dir, exist_ok=True)
    model_freq_path = os.path.join(model_dir, 'model_freq.joblib')
    model_interval_path = os.path.join(model_dir, 'model_interval.joblib')
    encoder_path = os.path.join(model_dir, 'encoder.joblib')

    data = load_data(road_segments_file)
    data = preprocess_data(data)

    data['PTRL_FREQ'] = data['PTRL_FREQ'].apply(extract_frequency_days)
    data.dropna(subset=['PTRL_FREQ'], inplace=True)
    
    data['target_frequency'], data['target_interval'] = prepare_targets(data['PTRL_FREQ'])
    selected_features = ['Length', 'AADT', 'Speed_Lmt', 'SNW_ACC_T', 'ICE_TIME', 'NumLanes', 'LaneKM']
    categorical_features = ['ST_NAME', 'ST_INT']

    X, encoder, original_categorical = prepare_features(data, selected_features, categorical_features)
    y_freq, y_interval = prepare_targets(data['PTRL_FREQ'])

    mask = ~y_freq.isna() & ~y_interval.isna()
    X = X[mask]
    y_freq = y_freq[mask]
    y_interval = y_interval[mask]

    if y_freq.isnull().values.any() or y_interval.isnull().values.any():
        raise ValueError("Target variables contain NaN values. Please handle missing values.")

    X_train, X_test, y_train_freq, y_test_freq = train_test_split(X, y_freq, test_size=0.2, random_state=42)
    X_train, X_test, y_train_interval, y_test_interval = train_test_split(X, y_interval, test_size=0.2, random_state=42)

    if os.path.exists(model_freq_path) and os.path.exists(model_interval_path) and os.path.exists(encoder_path):
        model_freq = joblib.load(model_freq_path)
        model_interval = joblib.load(model_interval_path)
        encoder = joblib.load(encoder_path)
    else:
        model_freq = None
        model_interval = None

    models, y_pred, metrics = train_evaluate_model(X_train, y_train_freq, y_train_interval, X_test, y_test_freq, y_test_interval, model_freq, model_interval)

    joblib.dump(models[0], model_freq_path)
    joblib.dump(models[1], model_interval_path)
    joblib.dump(encoder, encoder_path)

    plot_image_freq, plot_image_interval = get_plot_image(y_test_freq, y_pred[:, 0], y_test_interval, y_pred[:, 1])

    return render(request, 'patrol/model.html', {
        'plot_image_freq': plot_image_freq,
        'plot_image_interval': plot_image_interval,
        'timestamp' : now().timestamp(),
    })

# ====== Settings ======
def settings_view(request):
    if request.method == 'POST':
        form = SettingsForm(request.POST, instance=request.user)
        if form.is_valid():
            user = form.save(commit=False)
            if form.cleaned_data.get('new_password'):
                if form.cleaned_data['old_password']:
                    if user.check_password(form.cleaned_data['old_password']):
                        user.set_password(form.cleaned_data['new_password'])
                        update_session_auth_hash(request, user)
                        messages.success(request, 'Profile updated successfully.')
                    else:
                        messages.error(request, 'Old password is incorrect.')
            else:
                messages.success(request, 'Profile updated successfully.')
            user.save()
            return redirect('settings')
    else:
        form = SettingsForm(instance=request.user)
    
    return render(request, 'patrol/settings.html', {'form': form})

# ====== Signup ======
def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            email = form.cleaned_data.get('email')
            
            if User.objects.filter(username=username).exists():
                messages.error(request, 'A user already exists. Please use a different username.')
            elif User.objects.filter(email=email).exists():
                messages.error(request, 'A user already exists. Please use a different email.')
            else:
                user = form.save()
                return redirect('login')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = SignUpForm()
    
    return render(request, 'patrol/signup.html', {'form': form})

# ====== Login ======
def login(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                auth_login(request, user)
                if form.cleaned_data.get('remember'):
                    request.session.set_expiry(3600 * 24 * 30)  
                else:
                    request.session.set_expiry(0)  
                return redirect('dashboard')
            else:
                messages.error(request, 'Invalid username or password.')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = LoginForm()
    return render(request, 'patrol/login.html', {'form': form})

# ======== Logout ===========
def logout_view(request):
    auth_logout(request)
    return redirect('login')

# ======= Redirect to Login =======
def redirect_to_login(request):
    return redirect('login')

# ========= Delete Patrol Table =========
def delete_patrol_entry(request, entry_id):
    if request.method == 'POST':
        try:
            entry = PatrolRoutineTable.objects.get(id=entry_id)
            entry.delete()
            return JsonResponse({'status': 'success'})
        except PatrolRoutineTable.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Entry not found'})

# =========== Edit Patrol Table ============
def edit_patrol_entry(request, entry_id):
    if request.method == 'POST':
        try:
            entry = PatrolRoutineTable.objects.get(id=entry_id)
            entry.st_name = request.POST.get('street-name', entry.st_name)
            entry.ptrl_freq = request.POST.get('patrol-frequency', entry.ptrl_freq)
            entry.start_date = request.POST.get('date', entry.start_date)
            entry.comments = request.POST.get('comment', entry.comments)
            entry.save()
            return JsonResponse({'status': 'success'})
        except PatrolRoutineTable.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Entry not found'})

#============ Get Street Names ==========
def get_street_names(request):
    route_id = request.GET.get('route_id')
    patrol_routes = PatrolRoute.objects.filter(route_id=route_id).values('street_name').distinct()
    street_names = [route['street_name'] for route in patrol_routes]
    return JsonResponse(street_names, safe=False)

#============ Get Intersections ===========
def get_intersections(request):
    street_name = request.GET.get('street_name')
    patrol_routes = PatrolRoute.objects.filter(street_name=street_name).values(
        'from_intersection__name', 'to_intersection__name', 'patrol_frequency'
    )
    intersections = list(patrol_routes)
    return JsonResponse(intersections, safe=False)