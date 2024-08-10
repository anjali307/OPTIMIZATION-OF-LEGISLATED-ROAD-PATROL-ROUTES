from django.urls import path
from django.contrib.auth.decorators import login_required
from patrol import views

urlpatterns = [
    path('', views.redirect_to_login, name='redirect-to-login'), 
    path('dashboard/', login_required(views.dashboard), name='dashboard'),
    path('calendar/', login_required(views.calendar_view), name='calendar'),
    path('model/', login_required(views.model_view), name='model'),
    path('settings/', login_required(views.settings_view), name='settings'),
    path('login/', views.login, name='login'),
    path('signup/', views.signup, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('api/dashboard-data/', login_required(views.dashboard_data), name='dashboard-data'),
    path('api/get-intersections/', login_required(views.get_intersections), name='get-intersections'),
    path('api/get-street-names/', login_required(views.get_street_names), name='get_street_names'),
    path('delete-entry/<int:entry_id>/', login_required(views.delete_patrol_entry), name='delete-patrol-entry'),
    path('edit-entry/<int:entry_id>/', login_required(views.edit_patrol_entry), name='edit-patrol-entry'),
    path('static/<path:path>', views.serve_static_file, name='serve-static-file'),

]
