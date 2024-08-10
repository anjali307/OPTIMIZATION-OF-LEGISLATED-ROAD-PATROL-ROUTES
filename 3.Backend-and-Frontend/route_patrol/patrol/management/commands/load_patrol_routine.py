
from .imports import *

class Command(BaseCommand):
    help = 'Load initial data from Excel files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--print-data',
            action='store_true',
            help='Print loaded data to console',
        )

    def handle(self, *args, **kwargs):
        print_data = kwargs['print_data']

        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        dataset_dir = os.path.join(base_dir, 'dataset')
        calendar_file = os.path.join(dataset_dir, 'calendar.xlsx')

        try:
            # Delete the previous data
            PatrolRoutineTable.objects.all().delete()

            patrol_routine_data = pd.read_excel(calendar_file)
            patrol_routine_data['Start Date'] = pd.to_datetime(patrol_routine_data['Start Date'], errors='coerce')
            
            for _, row in patrol_routine_data.iterrows():
                st_name = row['ST_NAME']
                ptrl_freq = row['PTRL_FREQ']
                start_date = row['Start Date']
                
                if pd.isna(start_date):
                    continue
                
                PatrolRoutineTable.objects.update_or_create(
                    st_name=st_name,
                    ptrl_freq=ptrl_freq,
                    start_date=start_date
                )

            # add random comments
            random_comments = [
                'Check all entrances',
                'Inspect fire exits',
                'Monitor parking lot',
            ]

            events = PatrolRoutineTable.objects.all()

            for event in events:
                event.comments = ''
                event.save()

            for event in events:
                num_comments = random.randint(1, 1)
                
                selected_comments = random.sample(random_comments, num_comments)
                event.comments = ', '.join(selected_comments)
                
                event.save()

            self.stdout.write(self.style.SUCCESS('Data loaded and updated successfully'))

        except pd.errors.EmptyDataError:
            self.stdout.write(self.style.ERROR('Empty data error: Excel file is empty or does not exist'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))
