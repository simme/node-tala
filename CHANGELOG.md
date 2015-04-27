### 1.0.3 (2015-04-27)


#### Bug Fixes

* **api:** payload validation improvements ([14bae87b](https://github.com/simme/node-tala/commit/14bae87b54b147b112c8345546327e9ea995dffd))
* **client:** code cleanup ([66440782](https://github.com/simme/node-tala/commit/664407823be4fff5942665bfe562753df72b200f))
* **code:** add lintlovin and fix linting issues ([0ddc8b56](https://github.com/simme/node-tala/commit/0ddc8b5632b8a8d07f4bd49506249571ce36a97d))
* **xss:**
  * replace custom XSS filtering with sanitize-html ([4b5bf740](https://github.com/simme/node-tala/commit/4b5bf740a198ad635034a42fcfea638f4bfc60f4), closes [#34](https://github.com/simme/node-tala/issues/34))
  * make sure only http protocols are allowed as hrefs ([0103d2ba](https://github.com/simme/node-tala/commit/0103d2ba59026ad66f975f40f4733f8c9364d9b1), closes [#36](https://github.com/simme/node-tala/issues/36))


### 1.0.2 (2015-04-26)


#### Bug Fixes

* **client:**
  * add classes to HTML output for easier styling ([933a6c47](https://github.com/simme/node-tala/commit/933a6c47d2167d3ec8324c3c05cf0763d540721e))
  * catch JSON parse errors ([5bb84ce8](https://github.com/simme/node-tala/commit/5bb84ce84e62bb5aa0b59a0680f4cf06a7f39977))
  * encode URI when sending comment ([440ea856](https://github.com/simme/node-tala/commit/440ea856190a07daa3401f441f8956c246c99a2b))
* **dependency:** broken dependency on uglify ([7d6c3a83](https://github.com/simme/node-tala/commit/7d6c3a83db5993b0bf3d4481b6d908bb9d3afc87))
* **project:** add note on contributing ([df1ea5e1](https://github.com/simme/node-tala/commit/df1ea5e1c5d41075693dc8ed8898eec28c45ff15))
* **server:** workaround for issue with stream reply ([7d48de06](https://github.com/simme/node-tala/commit/7d48de062cce7ef3170b289c63a1ce842485848a))


### 1.0.1 (2015-04-25)


#### Bug Fixes

* **client:**
  * catch JSON parse errors ([5bb84ce8](https://github.com/simme/node-tala/commit/5bb84ce84e62bb5aa0b59a0680f4cf06a7f39977))
  * encode URI when sending comment ([440ea856](https://github.com/simme/node-tala/commit/440ea856190a07daa3401f441f8956c246c99a2b))
* **dependency:** broken dependency on uglify ([7d6c3a83](https://github.com/simme/node-tala/commit/7d6c3a83db5993b0bf3d4481b6d908bb9d3afc87))
* **server:** workaround for issue with stream reply ([7d48de06](https://github.com/simme/node-tala/commit/7d48de062cce7ef3170b289c63a1ce842485848a))

