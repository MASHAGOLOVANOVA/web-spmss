docker-build-img: ## build react img
	docker build --pull --rm -t ggghfffg/spams:front .

docker-run-react: ## launch react app
	docker run -it --rm -v ${PWD}:/app -v /node_modules -p 3000:3000 -e CHOKIDAR_USEPOLLING=true ggghfffg/spams:front
