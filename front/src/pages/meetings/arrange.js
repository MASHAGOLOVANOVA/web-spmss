import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'universal-cookie';
import { Row, Button, Col, Form, Modal } from 'react-bootstrap';
import SpinnerCenter from 'pages/shared/Spinner';
import { GetUtcDate } from 'pages/shared/FormatDates';

const cookies = new Cookies();

const getReqOptions = {
    method: "GET",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token')
    }
};

let postMeetingReqOptions = {
    method: "POST",
    mode: "cors",
    cache: "default",
    credentials: 'include',
    headers: {
        "Session-Id": cookies.get('session_token'),
        "Content-Type": "application/json",
    },
};

function ArrangeMeeting() {
    const [meetings, setMeetings] = useState(null);
    const [formData, setFormData] = useState({});
    const [showAddMeetingResult, setShowAddMeetingResult] = useState(false);
    const [addMeetingResult, setAddMeetingResult] = useState(null);
    const [integr, setIntegr] = useState(null);
    const [timeError, setTimeError] = useState(null);

    const timeRef = useRef(null);

    useEffect(() => {
        // setting meeting defaults
        setFormData({
            "duration": 30, // default duration 30 minutes
            "description": "",
            "meeting_time": "",
            "is_online": false
        });
        fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/account/integrations`, getReqOptions)
            .then(response => response.json())
            .then(json => {
                setIntegr(json);
            });
    }, []);

    function resetTime() {
        const element = timeRef.current;
        element.value = "";
    }

    function getCurrentTime() {
        const now = new Date();
        const curTime = new Date(now.getTime());
        return curTime;
    }
 
    function validateMeetingTime(selectedTime) {
        const curTime = getCurrentTime();
        const selectedDate = new Date(selectedTime);
        
        // Compare the selected time with current Perm time
        return selectedDate > curTime;
    }

    const handleChange = (event) => {
        const name = event.target.name;
        let value = event.target.value;
        
        // Преобразуем значение в число, если это поле duration
        if (name === "duration") {
            value = parseInt(value, 10) || 0;
        }
        
        // Validate time when meeting_time changes
        if (name === "meeting_time" && value) {
            if (!validateMeetingTime(value)) {
                setTimeError("Время встречи должно быть позже текущего времени");
            } else {
                setTimeError(null);
            }
        }
        
        setFormData(values => ({ ...values, [name]: value }));
    }

    const handleCehckboxChange = (event) => {
        const name = event.target.name;
        const checked = event.target.checked;
        setFormData(values => ({ ...values, [name]: checked }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
    
    // Validate time before submitting
        if (formData["meeting_time"] && !validateMeetingTime(formData["meeting_time"])) {
            setTimeError("Время встречи должно быть позже текущего времени");
            return;
        }
    
        resetTime();
        prepareReqBody();
        OpenRequestResultModal();
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_ADDR}/api/v1/slots/addslot`, postMeetingReqOptions);
            const status = response.status;
            console.log("Response status:", status);
            
            if (status === 200) {
                const data = await response.json();
                console.log("Slot created with ID:", data);
                event.target.reset();
                setAddMeetingResult(status);
                return;
            }
            
            setAddMeetingResult(status);
        } catch (error) {
            console.error("Error:", error);
            setAddMeetingResult(500);
        }
}

function prepareTimeForServer(localTimeString) {
    const localDateTime = new Date(localTimeString);
    // Создаем строку в формате ISO без учета часового пояса
    const isoDateTime = new Date(localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000).toISOString();

  return new Date(localTimeString).toISOString();
}

    function prepareReqBody() {
  const serverTime = prepareTimeForServer(formData["meeting_time"]);
  formData["meeting_time"] = serverTime;
  postMeetingReqOptions["body"] = JSON.stringify(formData);
}

    function OpenRequestResultModal() {
        setShowAddMeetingResult(true);
    }

    function CloseRequestResultModal() {
        setShowAddMeetingResult(false);
        setAddMeetingResult(null);
    }

    function RenderRequestResultModal() {
        let header = "Встреча назначена!";
        let body = "Вы можете просмотреть её в своем расписании здесь или в подключенном календаре.";
        if (addMeetingResult !== 200) {
            if (addMeetingResult === -1) {
                header = "Пересечение встреч!";
                body = `На данное время уже назначена встреча! Она начинается в: ${meetings[0].time}`;
            }
            else {
                header = "Произошла ошибка при назанчении встречи!";
                body = `Код ошибки: ${addMeetingResult}. Обратитесь в службу поддержки, если проблема не устранится.`;
                if (addMeetingResult === 400) {
                    body = "На это время уже назначена встреча!"
                }
            }
        }
        return <>
            <Modal.Header>
                <Modal.Title>{header}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{body}</Modal.Body>
            <Modal.Footer>
                <Button className='style-button' onClick={CloseRequestResultModal}>
                    ОК
                </Button>
            </Modal.Footer>
        </>
    }

    return (
        <>
            <Row className='justify-content-center'>
                <Col xs={11} md={10} lg={8}>
                    <h1 className='mb-4'>Добавить свободный слот</h1>
                    <hr />
                    <div >
                        {integr ? integr.planner ?
                            <Row className='justify-content-center'>
                                <Col xs={12} sm={8}>
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3" controlId="meetDesc">
                                            <Form.Label>Описание</Form.Label>
                                            <Form.Control name="description" onChange={handleChange} placeholder="Введите описание" />
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="meetTime">
                                            <Form.Label>Дата и время *</Form.Label>
                                            <Form.Control 
                                                ref={timeRef} 
                                                name="meeting_time" 
                                                onChange={handleChange} 
                                                required 
                                                type="datetime-local"
                                                placeholder="Введите время встречи"
                                                id="meeting-time"
                                                min={new Date().toISOString().slice(0, 16)}
                                            />
                                            {timeError && <Form.Text className="text-danger">{timeError}</Form.Text>}
                                        </Form.Group>

                                        <Form.Group className="mb-3" controlId="meetDuration">
                                            <Form.Label>Длительность (минуты) *</Form.Label>
                                            <Form.Control 
                                                name="duration" 
                                                onChange={handleChange} 
                                                required 
                                                type="number" 
                                                min="1" 
                                                max="180" 
                                                value={formData.duration}
                                                placeholder="Введите длительность встречи в минутах"
                                            />
                                            <Form.Text className="text-muted">
                                                Максимальная длительность - 3 часа (180 минут)
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3 " controlId="isOnline">
                                            <label className="style-checkmark-label">
                                                <input 
                                                    name="is_online" 
                                                    onChange={handleCehckboxChange} 
                                                    type="checkbox" 
                                                    className="style-default-checkmark" 
                                                />
                                                <span className="style-checkmark"></span>
                                                Онлайн
                                            </label>
                                        </Form.Group>
                                        <Button 
                                            type="submit" 
                                            className="style-button"
                                            disabled={timeError} // Disable button if there's a time error
                                        >
                                            Добавить
                                        </Button>
                                    </Form>
                                </Col>
                            </Row>
                            :
                            <>
                                <h3>Вы еще не подключили планировщик, это можно сделать <a href='/profile'>здесь</a></h3>
                            </> :
                            SpinnerCenter()}
                    </div>
                </Col>
            </Row>
            <Modal backdrop="static" show={showAddMeetingResult} onHide={CloseRequestResultModal}>
                {addMeetingResult ? RenderRequestResultModal() :
                    <Modal.Header className="justify-content-md-center">
                        {SpinnerCenter()}
                    </Modal.Header>}
            </Modal>
        </>
    );
};

export default ArrangeMeeting;