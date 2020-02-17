/* eslint-disable jest/valid-expect */
/* global describe, it */
import { expect } from 'chai';
import { getWindowTitle } from '../../src/utils/helpers';

describe('helpers', () => {
  const baseTitle = 'Bug Count Dashboard';

  it('should return the base title no pageTitle argument is provided', () => {
    expect(getWindowTitle()).equal(baseTitle);
  });

  it('should return only the base title if the argument has a similar text', () => {
    const fakePageTitle = 'Bug Count';
    expect(getWindowTitle(fakePageTitle)).equal(baseTitle);
  });

  it('should return the page title concatenated with the page title', () => {
    const fakePageTitle = 'Awesile Title';
    expect(getWindowTitle(fakePageTitle)).equal(`${fakePageTitle} - ${baseTitle}`);
  });
});
