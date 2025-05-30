
import { Col, Row } from 'react-bootstrap';


const Home = () => {
  return (<> <Row className='justify-content-center'>
    <Col xs={11} md={10} lg={8}>
      <h1>Главная страница</h1>
      <hr/>
      <div>
        Данное приложение находится в стадии активной разработки. Многий функционал не реализован подобающим образом.
        <p></p>
        Для корректной работы требуется установить войти в аккаунт и настроить интеграции для GitHub, Google Drive и Calendar.
        <p></p>
      </div>
    </Col>
  </Row>
  </>);
};

export default Home;