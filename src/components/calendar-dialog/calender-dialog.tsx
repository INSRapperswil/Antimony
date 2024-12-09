import React, {useEffect, useMemo, useState} from 'react';

import moment from 'moment';
import {Calendar, momentLocalizer, View, Views} from 'react-big-calendar';

import {Lab, LabState, uuid4} from '@sb/types/types';
import {useCalendarLabStore} from '@sb/lib/stores/root-store';
import SBDialog from '@sb/components/common/sb-dialog/sb-dialog';
import ReservationDialog from '@sb/components/dashboard-page/reservation-dialog/reservation-dialog';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calender-dialog.sass';
import {observer} from 'mobx-react-lite';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  id: uuid4;
  state: LabState;
  start: Date;
  end: Date;
}

const labStateColors: {[key: number]: string} = {
  0: 'var(--info-color)',
  1: 'var(--warning-color)',
  2: 'var(--success-color)',
  3: 'var(--danger-color)',
  4: 'var(--neutral-color)',
};

interface CalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarDialog: React.FC<CalendarProps> = observer(
  (props: CalendarProps) => {
    const [currentView, setCurrentView] = useState<View>('month');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedEvent, setSelectedEvent] = useState<Lab | null>(null);
    const [isReservationDialogOpen, setIsReservationDialogOpen] =
      useState(false);

    const calendarLabStore = useCalendarLabStore();

    useEffect(() => {
      const startDate: Date = moment(currentDate).startOf('month').toDate();
      const endDate: Date = moment(currentDate).endOf('month').toDate();
      calendarLabStore.setDates(startDate.toISOString(), endDate.toISOString());
      calendarLabStore.setLimit(1000);
      calendarLabStore.setStateFilter([
        LabState.Deploying,
        LabState.Done,
        LabState.Failed,
        LabState.Running,
        LabState.Scheduled,
      ]);
    }, []);

    const events = useMemo(() => {
      return calendarLabStore.data.map(lab => ({
        title: lab.name,
        id: lab.id,
        state: lab.state,
        start: new Date(lab.startDate),
        end: new Date(lab.endDate),
      }));
    }, [calendarLabStore.data]);

    const handleRangeChange = (range: Date[] | {start: Date; end: Date}) => {
      if (Array.isArray(range)) {
        calendarLabStore.setDates(
          range[0].toISOString(),
          range[range.length - 1].toISOString()
        );
      } else {
        console.log('STARTDATE:', range.start);
        console.log('ENDDATE:', range.end);

        console.log('ISO STARTDATE:', range.start.toISOString());
        console.log('ISO ENDDATE:', range.end.toISOString());
        calendarLabStore.setDates(
          range.start.toISOString(),
          range.end.toISOString()
        );
      }
    };

    const handleEventSelect = (event: CalendarEvent) => {
      if (event.state === LabState.Scheduled) {
        const lab: Lab | undefined = calendarLabStore.data.find(
          lab => lab.id === event.id
        );
        setSelectedEvent(lab!);
        setIsReservationDialogOpen(true);
      } else {
        return;
      }
    };

    function onClose(): void {
      setIsReservationDialogOpen(false);
    }

    const handleViewChange = (view: View): void => {
      setCurrentView(view);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
      const backgroundColor = labStateColors[event.state];
      return {
        style: {
          backgroundColor,
          borderRadius: '5px',
          color: 'white',
          border: 'none',
          display: 'block',
        },
      };
    };

    return (
      <SBDialog
        className="calender-dialog"
        headerTitle="Calendar"
        isOpen={props.isOpen}
        onClose={props.onClose}
        hideButtons={true}
      >
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events!}
            startAccessor="start"
            endAccessor="end"
            style={{height: '100%'}}
            view={currentView}
            defaultView="month"
            onView={handleViewChange}
            views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
            eventPropGetter={eventStyleGetter}
            toolbar={true}
            popup
            date={currentDate}
            onNavigate={date => setCurrentDate(date)}
            onRangeChange={handleRangeChange}
            onSelectEvent={handleEventSelect}
          />
        </div>
        {isReservationDialogOpen && (
          <ReservationDialog lab={selectedEvent!} onClose={onClose} />
        )}
      </SBDialog>
    );
  }
);

export default CalendarDialog;
