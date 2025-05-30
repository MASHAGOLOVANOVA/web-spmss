import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import Cookies from 'universal-cookie';
import { Row, Badge, Col, Alert, Button, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SpinnerCenter from 'pages/shared/Spinner';
const cookies = new Cookies();

const MeetingCard = ({ meeting, onReschedule, onCancel, onAddProject }) => {
  const formatDateWithWeekday = (date) => {
    const options = { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    return new Date(date).toLocaleDateString('ru-RU', options);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Row as="li" className="d-flex justify-content-between align-items-start mb-3 p-3 bg-dark rounded">
      <Col xs={12} sm={12} md={3} lg={2} className="pe-4">
        <div className="fw-bold text-light">
          {formatDateWithWeekday(meeting.start_time)}
        </div>
        <div className="text-muted">
          {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
        </div>
      </Col>
      
      <Col className="border-start ps-4">
      <Badge pill bg={meeting.is_online ? "success" : "secondary"}>
            {meeting.is_online ? "Online" : "Offline"}
          </Badge>
        <div className="me-2 fw-semibold">
          Студент: {meeting.student_name}
        </div>
        {meeting.project_id>0 && (
          <div className="fw-light mt-1 mb-1">
            Проект: {meeting.project_theme}
          </div>
        )}
        
        <div className="d-flex align-items-center mb-1">
          <span className="text-muted mb-2">{meeting.description}</span>
        </div>
        
        <div className="d-flex gap-2 mt-2">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => onReschedule(meeting)}
          >
            Перенести
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => onCancel(meeting)}
          >
            Отменить
          </Button>
          {!meeting.project_id && (
            <Button 
              variant="outline-success" 
              size="sm"
              onClick={() => onAddProject(meeting)}
            >
              Добавить проект
            </Button>
          )}
        </div>
      </Col>
    </Row>
  );
};

const NoMeetingsMessage = () => (
  <div className="text-center py-4">
    <h4>Нет запланированных встреч</h4>
  </div>
);

const PlannerNotConnected = () => (
  <div className="text-center py-4">
    <h3>Планировщик не подключен</h3>
    <p>Вы можете подключить его <Link to="/profile">здесь</Link></p>
  </div>
);

const MeetingsList = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPlanner, setHasPlanner] = useState(false);
  const [error, setError] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('success');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportParams, setReportParams] = useState({
    projectId: '',
    studentId: '',
    startDate: '',
    endDate: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const getUniqueStudents = () => {
    const studentsMap = new Map();
    meetings.forEach(meeting => {
      if (meeting.student_id && meeting.student_name) {
        studentsMap.set(meeting.student_id, meeting.student_name);
      }
    });
    return Array.from(studentsMap, ([id, name]) => ({ id, name }));
  };

  const getUniqueProjects = () => {
    const projectsMap = new Map();
    meetings.forEach(meeting => {
      if (meeting.project_id && meeting.project_theme) {
        projectsMap.set(meeting.project_id, meeting.project_theme);
      }
    });
    return Array.from(projectsMap, ([id, theme]) => ({ id, theme }));
  };

  const handleReportParamChange = (e) => {
    const { name, value } = e.target;
    setReportParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = () => {
    setIsGeneratingReport(true);
    
    // Фильтруем консультации по выбранным параметрам
    let filteredMeetings = [...meetings];
    
    if (reportParams.projectId) {
        filteredMeetings = filteredMeetings.filter(
            m => m.project_id === parseInt(reportParams.projectId)
        );
    }
    
    if (reportParams.studentId) {
        filteredMeetings = filteredMeetings.filter(
            m => m.student_id === parseInt(reportParams.studentId)
        );
    }
    
    if (reportParams.startDate) {
        const startDate = new Date(reportParams.startDate);
        filteredMeetings = filteredMeetings.filter(
            m => new Date(m.start_time) >= startDate
        );
    }
    
    if (reportParams.endDate) {
        const endDate = new Date(reportParams.endDate);
        endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
        filteredMeetings = filteredMeetings.filter(
            m => new Date(m.start_time) <= endDate
        );
    }

    const headers = [
        'Дата консультации',
        'Время начала',
        'Время окончания',
        'Студент',
        'Проект',
        'Формат',
        'Описание'
    ];

    const totalConsultationTime = filteredMeetings.reduce((total, meeting) => {
      const startTime = new Date(meeting.start_time);
      const endTime = new Date(meeting.end_time);
      const durationInMinutes = (endTime - startTime) / (1000 * 60); // Конвертируем миллисекунды в минуты
      return total + durationInMinutes;
  }, 0);
  
  // Преобразуем общее количество минут в часы и минуты
  const hours = Math.floor(totalConsultationTime / 60);
  const minutes = totalConsultationTime % 60;
  
  // Форматируем строку с количеством часов и минут
  const totalConsultationHoursFormatted = `${hours} ч ${minutes} мин`;
  
    
    const rows = filteredMeetings.map(meeting => {
        const startDate = new Date(meeting.start_time);
        const endDate = new Date(meeting.end_time);
        
        return [
            startDate.toLocaleDateString('ru-RU'),
            startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            meeting.student_name || 'Не указан',
            meeting.project_theme || 'Не указан',
            meeting.is_online ? 'Online' : 'Offline',
            meeting.description || ''
        ];
    });

    const reportData = [
      [`Общее количество консультационных часов: ${totalConsultationHoursFormatted}`], // Добавляем строку с количеством часов
      [], // Пустая строка для разделения
      headers, // Заголовки
      ...rows // Данные
  ];

  // Создаем книгу и лист
  const worksheet = XLSX.utils.aoa_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Отчет');

  // Генерируем файл
  XLSX.writeFile(workbook, `consultations_report_${new Date().toISOString().slice(0, 10)}.xlsx`);

  setShowReportModal(false);
  setAlertMessage('Отчет успешно сформирован');
  setAlertVariant('success');
  setShowAlert(true);
  setIsGeneratingReport(false);
}; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const integrResponse = await fetch(
          `${process.env.REACT_APP_SERVER_ADDR}/api/v1/account/integrations`, 
          {
            method: "GET",
            headers: {
              "Session-Id": cookies.get('session_token')
            },
            credentials: 'include'
          }
        );
        
        const integrationData = await integrResponse.json();
        setHasPlanner(!!integrationData.planner);

        if (integrationData.planner) {
          const currentTime = new Date();
          
          const meetingsResponse = await fetch(
            `${process.env.REACT_APP_SERVER_ADDR}/api/v1/slots/professor/student`,
            {
              method: "GET",
              headers: {
                "Session-Id": cookies.get('session_token'),
                "Content-Type": "application/json"
              },
              credentials: 'include'
            }
          );
          
          const meetingsData = await meetingsResponse.json();
          setMeetings(meetingsData.slots || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Ошибка загрузки данных о встречах");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddProject = (meeting) => {
    setSelectedMeeting(meeting);
    fetchProjects(); // Загружаем список проектов
    setShowProjectModal(true);
  };

  // Загрузка проектов
  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_ADDR}/api/v1/projects`,
        {
          method: "GET",
          headers: {
            "Session-Id": cookies.get('session_token')
          },
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };


  const confirmAddProject = async () => {
    if (!selectedMeeting || !selectedProject) return;
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_ADDR}/api/v1/slots/${selectedMeeting.id}/addproject`,
        {
          method: "POST",
          headers: {
            "Session-Id": cookies.get('session_token'),
            "Content-Type": "application/json"
          },
          credentials: 'include',
          body: JSON.stringify({
            project_id: selectedProject.id
          })
        }
      );

      if (response.ok) {
        // Обновляем список встреч
        const updatedMeetings = await fetch(
          `${process.env.REACT_APP_SERVER_ADDR}/api/v1/slots/professor/student?from=${new Date().toISOString()}`,
          {
            method: "GET",
            headers: {
              "Session-Id": cookies.get('session_token'),
              "Content-Type": "application/json"
            },
            credentials: 'include'
          }
        );
        
        const meetingsData = await updatedMeetings.json();
        setMeetings(meetingsData.slots || []);
        
        setShowProjectModal(false);
        setAlertMessage('Проект успешно привязан к встрече');
        setAlertVariant('success');
        setShowAlert(true);
      } else {
        throw new Error('Ошибка при привязке проекта');
      }
    } catch (error) {
      console.error('Error adding project:', error);
      setAlertMessage('Не удалось привязать проект');
      setAlertVariant('danger');
      setShowAlert(true);
    }
  };


  const handleReschedule = (meeting) => {
    setSelectedMeeting(meeting);
    // Устанавливаем текущее время встречи как начальное значение
    const startTime = new Date(meeting.start_time);
    const formattedTime = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}-${String(startTime.getDate()).padStart(2, '0')}T${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    setNewMeetingTime(formattedTime);
    
    // Вычисляем длительность встречи в минутах
    const endTime = new Date(meeting.end_time);
    const duration = Math.round((endTime - startTime) / 60000);
    setNewDuration(isNaN(duration) ? 30 : duration); // По умолчанию 30 минут
    
    setShowRescheduleModal(true);
  };

  const handleCancel = (meeting) => {
    setSelectedMeeting(meeting);
    setShowCancelModal(true);
  };

  const handleTimeChange = (e) => {
    setNewMeetingTime(e.target.value);
  };

  const handleDurationChange = (e) => {
    setNewDuration(parseInt(e.target.value));
  };

  const confirmReschedule = async () => {
    try {
      if (!newMeetingTime) {
        setAlertMessage('Пожалуйста, укажите новое время встречи');
        setAlertVariant('danger');
        setShowAlert(true);
        return;
      }
      // Получаем локальную дату и время без преобразования в UTC
    const localDateTime = new Date(newMeetingTime);
    // Создаем строку в формате ISO без учета часового пояса
    const isoDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000).toISOString();

    console.log('Отправляемые данные:', {
      meeting_time: isoDateTime,
      duration: newDuration,
      description: selectedMeeting.description,
      is_online: selectedMeeting.is_online
    });

      const response = await fetch(
        `${process.env.REACT_APP_SERVER_ADDR}/api/v1/slots/${selectedMeeting.id}/update`,
        {
          method: "PUT",
          headers: {
            "Session-Id": cookies.get('session_token'),
            "Content-Type": "application/json"
          },
          credentials: 'include',
          body: JSON.stringify({
            meeting_time: new Date(newMeetingTime).toISOString(),
            duration: newDuration,
            description: selectedMeeting.description,
            is_online: selectedMeeting.is_online
          })
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка при переносе встречи');
      }

      // Обновляем список встреч
      const updatedMeetings = await fetch(
        `${process.env.REACT_APP_SERVER_ADDR}/api/v1/slots/professor/student?from=${new Date().toISOString()}`,
        {
          method: "GET",
          headers: {
            "Session-Id": cookies.get('session_token'),
            "Content-Type": "application/json"
          },
          credentials: 'include'
        }
      );
      
      const meetingsData = await updatedMeetings.json();
      setMeetings(meetingsData.slots || []);
      
      setShowRescheduleModal(false);
      setAlertMessage('Встреча успешно перенесена');
      setAlertVariant('success');
      setShowAlert(true);
      
    } catch (error) {
      console.error('Ошибка при переносе встречи:', error);
      setAlertMessage('Не удалось перенести встречу');
      setAlertVariant('danger');
      setShowAlert(true);
    }
  };

  const confirmCancel = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_ADDR}/api/v1/slots/${selectedMeeting.id}/del`,
        {
          method: "DELETE",
          headers: {
            "Session-Id": cookies.get('session_token'),
            "Content-Type": "application/json"
          },
          credentials: 'include'
        }
      );
  
      if (!response.ok) {
        throw new Error('Ошибка при отмене встречи');
      }
  
      // Обновляем список встреч после успешного удаления
      setMeetings(meetings.filter(m => m.id !== selectedMeeting.id));
      setShowCancelModal(false);
      
      // Показываем уведомление об успешной отмене
      setAlertMessage('Встреча успешно отменена');
      setAlertVariant('success');
      setShowAlert(true);
      
    } catch (error) {
      console.error('Ошибка при отмене встречи:', error);
      setAlertMessage('Не удалось отменить встречу');
      setAlertVariant('danger');
      setShowAlert(true);
    }
  };

  if (loading) return <SpinnerCenter />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!hasPlanner) return <PlannerNotConnected />;
  if (meetings.length === 0) return <NoMeetingsMessage />;

  return (
    <>
    <div className="d-flex justify-content-end mb-4">
        <Button 
          variant="primary" 
          onClick={() => setShowReportModal(true)}
          className="me-2"
        >
          Получить отчет по консультациям
        </Button>
      </div>
    {showAlert && (
      <Alert 
        variant={alertVariant} 
        onClose={() => setShowAlert(false)} 
        dismissible
        className="position-fixed top-0 end-0 m-3"
        style={{ zIndex: 9999 }}
      >
        {alertMessage}
      </Alert>
    )}
      <div className="meetings-list">
        {meetings.map((meeting, index) => (
          <MeetingCard 
            key={`meeting-${meeting.id}-${index}`} 
            meeting={meeting} 
            onReschedule={handleReschedule}
            onCancel={handleCancel}
            onAddProject={handleAddProject}
          />
        ))}
      </div>
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Формирование отчета по консультациям</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Проект</Form.Label>
                  <Form.Control
                    as="select"
                    name="projectId"
                    value={reportParams.projectId}
                    onChange={handleReportParamChange}
                  >
                    <option value="">Все проекты</option>
                    {getUniqueProjects().map(project => (
                      <option key={project.id} value={project.id}>
                        {project.theme} (ID: {project.id})
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Студент</Form.Label>
                  <Form.Control
                    as="select"
                    name="studentId"
                    value={reportParams.studentId}
                    onChange={handleReportParamChange}
                  >
                    <option value="">Все студенты</option>
                    {getUniqueStudents().map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} (ID: {student.id})
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Дата начала</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={reportParams.startDate}
                    onChange={handleReportParamChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Дата окончания</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={reportParams.endDate}
                    onChange={handleReportParamChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={generateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Формирование...' : 'Сформировать отчет'}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Модальное окно переноса */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Перенос встречи</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="newMeetingTime">
              <Form.Label>Новое время встречи *</Form.Label>
              <Form.Control 
                type="datetime-local" 
                value={newMeetingTime}
                onChange={handleTimeChange}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="newDuration">
              <Form.Label>Длительность (минуты) *</Form.Label>
              <Form.Control 
                type="number" 
                min="15" 
                max="180" 
                value={newDuration}
                onChange={handleDurationChange}
                required
              />
              <Form.Text className="text-muted">
                Минимальная длительность - 15 минут, максимальная - 3 часа
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={confirmReschedule}>
            Подтвердить перенос
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно отмены */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Отмена встречи</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы уверены, что хотите отменить встречу с {selectedMeeting?.student_name}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Нет
          </Button>
          <Button variant="danger" onClick={confirmCancel}>
            Да, отменить
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно для добавления проекта */}
      <Modal show={showProjectModal} onHide={() => setShowProjectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Выберите проект</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Проект</Form.Label>
            <Form.Control
              as="select"onChange={(e) => setSelectedProject(projects.find(p => String(p.id) === e.target.value))}
            >
              <option value="">Выберите проект...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.theme} (ID: {project.id})
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmAddProject}
            disabled={!selectedProject}
          >
            Привязать проект
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const Meetings = () => {
  return (
    <Row className='justify-content-center'>
      <Col xs={11} md={10} lg={8}>
        <h1 className='mb-4'>Встречи</h1>
        <hr />
        <MeetingsList />
      </Col>
    </Row>
  );
};

export default Meetings;