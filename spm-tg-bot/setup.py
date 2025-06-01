""" setup py file """
from setuptools import setup, find_packages


def read_requirements(filename):
    """ load requirements from file """
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read().splitlines()


setup(
    name='your_package_name',
    version='0.1',
    packages=find_packages(),
    install_requires=read_requirements('requirements.txt'),
)
