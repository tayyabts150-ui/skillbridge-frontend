module.exports = {
  '*.ts': ['eslint --fix', 'prettier --write'],
  '*.scss': ['stylelint --fix'],
  '*.{html,css,js,json,md,yml}': ['prettier --write'],
};
