package domainaggregate

import "fmt"

type Person struct {
	Id         string
	Name       string
	Surname    string
	Middlename string
}

func (p *Person) FullNameToString() string {
	fullname := fmt.Sprint(p.Surname, " ", p.Name)
	if p.Middlename != "" {
		fullname += fmt.Sprint(" ", p.Middlename)
	}
	return fullname
}
