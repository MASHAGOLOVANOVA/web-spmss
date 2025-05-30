package googleapi

import (
	"context"
	"net/http"

	"golang.org/x/oauth2"
)

type Google struct {
	api GoogleAPI
}

func InintGoogle(googleAPI GoogleAPI) Google {
	return Google{
		api: googleAPI,
	}
}

func (g *Google) GetAuthLink(redirectURI string, state string) (string, error) {
	url, err := g.api.GetAuthLink(redirectURI, state)
	if err != nil {
		return "", err
	}
	return url, nil
}

func (g *Google) GetToken(code string) (*oauth2.Token, error) {
	token, err := g.api.GetToken(code)
	if err != nil {
		return nil, err
	}
	return token, err
}

func (g *Google) GetContext() context.Context {
	return g.api.Context
}
func (g *Google) GetClient() *http.Client {
	return g.api.Client
}

func (g *Google) Authentificate(token *oauth2.Token) error {
	err := g.api.SetupClient(token)
	if err != nil {
		return err
	}
	return nil
}
