from .imports import *

class Command(BaseCommand):
    help = 'Load patrol routes from an Excel file'

    def handle(self, *args, **kwargs):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        dataset_dir = os.path.join(base_dir, 'dataset')
        patrol_routes = os.path.join(dataset_dir, 'patrol_routes.xlsx')
        
        # Delete previous data
        self.stdout.write('Deleting previous data...')
        PatrolRoute.objects.all().delete()
        Intersection.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Previous data deleted.'))

        # Load all sheets 
        sheets = pd.read_excel(patrol_routes, sheet_name=None)
        
        for sheet_name, data in sheets.items():
            self.stdout.write(f"Processing sheet: {sheet_name}")
            
            # Create or get the route
            route, created = Route.objects.get_or_create(name=sheet_name)
            
            for _, row in data.iterrows():
                # split intersection names 
                try:
                    from_intersection_name, to_intersection_name = map(str.strip, row['ST_INT'].split('to', 1))
                except ValueError:
                    self.stdout.write(self.style.ERROR(f"Skipping invalid intersection format: {row['ST_INT']}"))
                    continue
                
                # get the from_intersection
                from_intersection, from_created = Intersection.objects.get_or_create(name=from_intersection_name)
                if from_created:
                    self.stdout.write(self.style.SUCCESS(f"Created new intersection: {from_intersection_name}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"Existing intersection: {from_intersection_name}"))

                # get the to_intersection
                to_intersection, to_created = Intersection.objects.get_or_create(name=to_intersection_name)
                if to_created:
                    self.stdout.write(self.style.SUCCESS(f"Created new intersection: {to_intersection_name}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"Existing intersection: {to_intersection_name}"))
                
                # Create PatrolRoute
                PatrolRoute.objects.create(
                    route=route,
                    street_name=row['ST_NAME'],
                    from_intersection=from_intersection,
                    to_intersection=to_intersection,
                    speed_limit=row['Speed_Lmt'],
                    patrol_class=row['Class'],
                    patrol_frequency=row['PTRL_FREQ'],
                    lane_km=row['LaneKM'],
                    routes_11=row['Routes_11'],
                    days=row['Days']
                )

            self.stdout.write(self.style.SUCCESS(f"Successfully loaded patrol routes for sheet: {sheet_name}"))

        self.stdout.write(self.style.SUCCESS('Successfully loaded all patrol routes'))
