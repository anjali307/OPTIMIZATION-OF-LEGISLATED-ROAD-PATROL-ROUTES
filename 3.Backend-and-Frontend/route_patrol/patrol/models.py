from django.db import models


# store intersection
class Intersection(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
    
# store route
class Route(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

# store patrol route
class PatrolRoute(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='patrol_routes', null=True, blank=True)
    street_name = models.CharField(max_length=100)
    from_intersection = models.ForeignKey(Intersection, on_delete=models.CASCADE, related_name='from_segments', null=True, blank=True)
    to_intersection = models.ForeignKey(Intersection, on_delete=models.CASCADE, related_name='to_segments', null=True, blank=True)
    speed_limit = models.IntegerField()
    patrol_class = models.IntegerField()
    patrol_frequency = models.CharField(max_length=100)
    lane_km = models.IntegerField()
    routes_11 = models.IntegerField()
    days = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.route.name} - {self.street_name} ({self.from_intersection} to {self.to_intersection})"

# store calendar data
class PatrolRoutineTable(models.Model):
    st_name = models.CharField(max_length=255)
    ptrl_freq = models.CharField(max_length=255)
    start_date = models.DateField()
    comments = models.TextField(blank=True)

    def __str__(self):
        return f'{self.st_name} - {self.ptrl_freq} - {self.start_date} - {self.comments}'
