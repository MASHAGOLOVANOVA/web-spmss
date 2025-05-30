
import { Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import LinkContainer from 'react-router-bootstrap/LinkContainer';

function ProjectSidebar(props) {
  return (
    <>
      <Row className="bg-body-tertiary d-grid gap-2 mb-4">
        <LinkContainer to={`/projects/${props.projectId}`}>
          <Button className='style-button-outline'>Информация</Button>
        </LinkContainer>
        <LinkContainer to={`/projects/${props.projectId}/tasks`}>
          <Button className='style-button-outline'>Задания</Button>
        </LinkContainer>
        <LinkContainer to={`/projects/${props.projectId}/commits`}>
          <Button className='style-button-outline'>Коммиты</Button>
        </LinkContainer>
        <LinkContainer to={`/projects/${props.projectId}/stats`}>
          <Button className='style-button-outline'>Статистика</Button>
        </LinkContainer>
      </Row>
    </>
  );
}

export default ProjectSidebar;