# Contributing

Thank you for your interest in contributing to the Regal Game Library!

In order for the Regal Framework to succeed, it needs support form other passionate creators. This means people to develop the framework itself, as well as individuals to write the games that adopt the framework.

## Table of Contents
* [Code of Conduct](#code-of-conduct)
* [Reporting Bugs](#reporting-bugs)
* [Suggesting Enhancements](#suggesting-enhancements)
* [Creating a Pull Request](#creating-a-pull-request)
* [Building the Project](#building-the-project)

## Code of Conduct

The most important core value of the Regal Framework is **Bring Joy to Everyone**. 

The Regal Framework is intended to be enjoyed by all people, on all platforms. This intention extends to those who work on the project.

Anyone participating in development or discussion of the Regal Framework is expected to act with respect, honesty, and kindness. No discrimination or harassment of any kind will be tolerated, ever.

If you believe someone is violating this code of conduct, please reach out to Joe at joe.r.cowman@gmail.com.

## Reporting Bugs

If you encounter a bug, try searching the [documentation](https://github.com/regal/regal/blob/master/README.md) and the repository's [issues](https://github.com/regal/regal/issues) (both open and closed!) to see if anyone has encountered the same thing.

If you don't have any luck, feel free to open a new issue. The more information you can provide, the better. Good things to include are:
* A clear description of the bug
* The full stack trace of any error messages
* Steps to reproduce the issue

## Suggesting Enhancements

Suggestions are always welcome! Feel free to open a new issue. It's helpful if you start the issue's title with "Suggestion".

If your suggestion gets approved, then you may be invited to create a pull request.

## Creating a Pull Request

If you would like to create a pull request to solve a bug or implement an approved suggestion, leave a comment saying so on the original issue.

Pull requests should contain a thorough description of all changes as well as links to any related issues.

This project uses [`commitizen`](https://github.com/commitizen/cz-cli) to keep commit messages consistent. Once you've built the project, use `git cz` to use the tool for creating a commit message. If your messages aren't styled correctly, your commits will likely be squashed when they're merged into master.

## Building the Project

1. Clone the repository.
2. `npm install`

The Regal Game Library uses [`prettier`](https://github.com/prettier/prettier) for linting, so you can either use the [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) (recommended) or do `npm run lint` before you commit, or else the CI build may fail.

To run the unit tests, do `npm test`.