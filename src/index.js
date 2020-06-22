import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {
  AutoSizer,
  Column,
  Table,
  SortIndicator,
  SortDirection,
} from 'react-virtualized';
import Immutable from 'immutable';
import 'react-virtualized/styles.css';
import './css/table.css'
import './css/img-wrapper.css'
import './css/card-v1.scss'
import ConfigFileSelector from './ConfigFileSelector';
import Card from './card-v1';

CoreControls.setWorkerPath('public/core');
CoreControls.forceBackendType('ems');
const imageUploadURL = 'process.php';

const baseUrl = window.location.href;
const librariesFolder = 'libraries'

// import WebViewer from '@pdftron/webviewer'
const styles = {};

const versionRenderer = function ({cellData, rowData, rowIndex, dataKey}) {
  // console.log(arguments[0])
  let linkA = null, linkB = null, linkC = null;
  let d = `d=${baseUrl}files/${rowData.filename}`;
  let config = `config=${baseUrl}configs/issue_9083.js`;
  let arrow = <i className="fas fa-long-arrow-alt-right fa-xs"></i>


  if (cellData.hasNewUI) {
    let urlA = createLibUrl(cellData.version,cellData.dir) + `#${d}&pdfnet=0&a=1&pdf=ems&office=ems&${config}`;
    let urlB = createLibUrl(cellData.version,cellData.dir) + `#${d}&pdfnet=1&a=1&pdf=ems&office=ems&${config}`;

    linkA = <a href={urlA} title={urlA} target="_blank"><span className="uk-label uk-label-success">lean {arrow}</span></a>
    linkB = <a href={urlB} title={urlB} target="_blank"><span className="uk-label uk-label-warning">full {arrow}</span></a>
  }
  if (cellData.hasLegacyUI) {
    let urlC = createLibUrl(cellData.version, cellData.dir, true) + `#${d}&pdfnet=0&pdf=auto&a=1`;
    linkC = <a href={urlC} title={urlC} target="_blank"><span className="uk-label uk-label-danger">legacy {arrow}</span></a>
  }

  if (rowData.config) {
    var _options = {
      path: `/libraries/${cellData.dir}/lib`,
      initialDoc: `${baseUrl}files/${rowData.filename}`,
      fullAPI: false,
      backendType: 'ems',
      config: `/configs/${rowData.config}`,
      // pdftronServer: 'http://localhost:8090/',
    }
    // var viewer = './wv/freshchat-howard-shelburne.js';
    // var viewer = './wv/andreys_issue.js';
    var viewer = './viewer.js';
    console.log(_options);
    let __url = `/viewer.php?libPath=/libraries/${cellData.dir}/lib&o=${JSON.stringify(_options)}&viewer=${viewer}`
    linkA = <a href={__url} title={__url} target="_blank"><span className="uk-label uk-label-success">lean {arrow}</span></a>


    var _options = {
      path: `/libraries/${cellData.dir}/lib`,
      initialDoc: `${baseUrl}files/${rowData.filename}`,
      fullAPI: true,
      backendType: 'ems',
      config: `/configs/${rowData.config}`,
      // pdftronServer: 'http://localhost:8090/',
    }
    let __urlB = `/viewer.php?libPath=/libraries/${cellData.dir}/lib&o=${JSON.stringify(_options)}&viewer=${viewer}`
    linkB = <a href={__urlB} title={__urlB} target="_blank"><span className="uk-label uk-label-warning">full {arrow}</span></a>
  }
  return <div>{linkA} {linkB} {linkC}</div>
}

const thumbnailRenderer = function({cellData, rowData, rowIndex, dataKey}) {
  if (cellData) {
    return (
      <div className="img-wrapper">
        <img src={cellData} />
        <div className="border"></div>
      </div>
    );
  }
  return <div>Foo</div>
}

const tableColumns = {};
const source = FILES.map((item, index) => {
  let thumbName = item.split('.').slice(0, -1).join('.') + '.png'
  let thumb = THUMBS.filter(item => item === thumbName)[0];
  if (thumb) {
    thumb = `/uploads/${thumb}`
  }
  var json = {
    index,
    filename: item,
    image: thumb
  }
  wv_versions.forEach(wv => {
    tableColumns[wv.version] = 1;

    json[wv.version] = {
      dir: wv.folder,
      hasLegacyUI: wv.version[0] <= '5',
      hasNewUI: wv.version[0] >= '4',
      version: wv.version,
    }
  })

  return json;
})
// console.log(source, Object.keys(tableColumns));

class App extends React.Component {
  // static contextTypes = {
  //   list: PropTypes.instanceOf(Immutable.List).isRequired,
  // };
  constructor(props, context) {
    super(props, context);

    const sortBy = 'index';
    const sortDirection = SortDirection.ASC;
    var sortedList = this._sortList({sortBy, sortDirection});

    var configFile = '';
    sortedList = sortedList.map(item => {
      item['config'] = configFile
      return item
    })

    this.state = {
      disableHeader: false,
      headerHeight: 30,
      height: 1000,
      hideIndexRow: false,
      overscanRowCount: 10,
      rowHeight: 50,
      rowCount: source.length,
      scrollToIndex: undefined,
      sortBy,
      sortDirection,
      sortedList,
      useDynamicRowHeight: false,
      config_files: config_files,
      configFile: configFile
    };
    this._getRowHeight = this._getRowHeight.bind(this);
    this._headerRenderer = this._headerRenderer.bind(this);
    this._noRowsRenderer = this._noRowsRenderer.bind(this);
    this._onRowCountChange = this._onRowCountChange.bind(this);
    this._onScrollToRowChange = this._onScrollToRowChange.bind(this);
    this._rowClassName = this._rowClassName.bind(this);
    this._sort = this._sort.bind(this);
  }
  componentDidMount(){
    window.updateThumbs = function(thumbs) {
      // this.setState({ thumbs })
      console.log(this.state)
      var sortedList = this.state.sortedList.map(item => {
        var name = item.filename.split('.').slice(0, -1).join('.') + '.png'
        item['image'] = 'uploads/' + thumbs.filter(thumb => thumb === name)[0];
        return item
      })

      this.setState({ sortedList });
    }.bind(this)
  }
  _onScrollToRowChange(event) {
    const {rowCount} = this.state;
    let scrollToIndex = Math.min(
      rowCount - 1,
      parseInt(event.target.value, 10),
    );

    if (isNaN(scrollToIndex)) {
      scrollToIndex = undefined;
    }

    this.setState({scrollToIndex});
  }
  _onRowCountChange(event) {
    const rowCount = parseInt(event.target.value, 10) || 0;

    this.setState({rowCount});
  }
  _sort({sortBy, sortDirection}) {
    const sortedList = this._sortList({sortBy, sortDirection});

    this.setState({sortBy, sortDirection, sortedList});
  }
  _sortList({sortBy, sortDirection}) {
    const {list} = this.props;

    return list
      .sortBy(item => item[sortBy])
      .update(list =>
        sortDirection === SortDirection.DESC ? list.reverse() : list,
      );
  }
  _noRowsRenderer() {
    return <div className={styles.noRows}>No rows</div>;
  }
  _rowClassName({index}) {
    if (index < 0) {
      return styles.headerRow;
    } else {
      return index % 2 === 0 ? styles.evenRow : styles.oddRow;
    }
  }
  _getDatum(list, index) {
    return list.get(index % list.size);
  }
  _getRowHeight({index}) {
    const {list} = this.props;

    return this._getDatum(list, index).size;
  }
  _headerRenderer({dataKey, sortBy, sortDirection}) {
    return (
      <div>
        Full Name
        {sortBy === dataKey && <SortIndicator sortDirection={sortDirection} />}
      </div>
    );
  }
  _isSortEnabled() {
    const {list} = this.props;
    const {rowCount} = this.state;

    return rowCount <= list.size;
  }
  onConfigSelect(e) {
    var sortedList = this.state.sortedList.map(item => {
      item['config'] = e.target.value
      return item
    })

    this.setState({ sortedList, configFile: e.target.value });

  }
  render() {
    const {
      disableHeader,
      headerHeight,
      height,
      hideIndexRow,
      overscanRowCount,
      rowHeight,
      rowCount,
      scrollToIndex,
      sortBy,
      sortDirection,
      sortedList,
      useDynamicRowHeight,
   } = this.state;

   let columns = wv_versions.map(item => {
     return <Column
        key={item.folder}
        dataKey={item.version}
        label={item.version}
        cellRenderer={versionRenderer}
        width={150}
     />
   })
   const rowGetter = ({index}) => this._getDatum(sortedList, index);
   console.log(this.state.sortedList.toJS())
  //  return <Card></Card>
    return (
      <div>
        <ConfigFileSelector
          configs={this.state.config_files}
          selectedConfig={this.state.configFile}
          onConfigSelect={this.onConfigSelect.bind(this)}
        />
        <AutoSizer disableHeight>
          {({width}) => (
            <Table
              ref="Table"
              disableHeader={disableHeader}
              className="GalleryItem"

              headerHeight={headerHeight}
              height={height}
              noRowsRenderer={this._noRowsRenderer}
              overscanRowCount={overscanRowCount}

              rowHeight={useDynamicRowHeight ? this._getRowHeight : rowHeight}
              rowGetter={rowGetter}
              rowCount={rowCount}
              scrollToIndex={scrollToIndex}
              width={width}>
              {!hideIndexRow && (
                <Column
                  label=""
                  cellDataGetter={({rowData}) => rowData.index}
                  dataKey="index"
                  disableSort={!this._isSortEnabled()}
                  width={30}
                />
              )}
              <Column
                dataKey="image"
                disableSort={!this._isSortEnabled()}
                label="Thumbnail"
                cellRenderer={thumbnailRenderer}
                width={95}
              />
              <Column
                dataKey="name"
                disableSort={!this._isSortEnabled()}
                label="File name"
                cellRenderer={({rowIndex}) => FILES[rowIndex]}
                width={350}
              />
              {columns}
              {/*<Column
                width={210}
                disableSort
                label="The description label is really long so that it will be truncated"
                dataKey="description"

                cellRenderer={({cellData}) => cellData}
                flexGrow={1}
              />*/}
            </Table>
          )}
        </AutoSizer>
      </div>
    );
  }
}








function createLibUrl(version, wvFolder, isLegacyUI) {
  if (isLegacyUI && version[0] >= 4 && version[0] <= 5) {
    return `${baseUrl}${librariesFolder}/${wvFolder}/lib/ui-legacy/ReaderControl.html`;
  }
  if (isLegacyUI && version[0] >= 2 && version[0] <= 3) {
    return `${baseUrl}${librariesFolder}/${wvFolder}/lib/html5/ReaderControl.html`;
  }

  var link = ``;
  if (version[0] >= 6 || version === 'dev' || version === 'pdf_prime_update' ) {
    link = `${baseUrl}${librariesFolder}/${wvFolder}/lib/ui/index.html`
  } else if (version[0] >= 4 && version[0] <= 5) {
    link = `${baseUrl}${librariesFolder}/${wvFolder}/lib/ui/build/index.html`
  } else if (version[0] >= 3 && version[0] <= 4) {
    link = `${baseUrl}${librariesFolder}/${wvFolder}/lib/ui/build/index.html`
  } else if (version[0] >= 2 && version[0] <= 3) {
    link = `${baseUrl}${librariesFolder}/${wvFolder}/lib/html5/ReaderControl.html`
  } else {
    link =   `${baseUrl}${librariesFolder}/${wvFolder}/lib/ui/index.html`
  }
  return link;
}











ReactDOM.render(
  <App list={Immutable.List(source)}/>,
  document.getElementById('root')
);





function checkIfMissingThumb(files, thumbs) {
  // console.log(thumbs);

  let missingThumbsFiles = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = file.split('.').slice(0, -1).join('.') + '.png'
    // console.log(name)
    let x = thumbs.includes(name) //.filter(item => item.indexOf(name) > -1)[0];

    if (!x) {
      missingThumbsFiles.push(file);
    }

  }

  return missingThumbsFiles;
}

function runWithThumb() {
  console.log('runWithThumb')


  const array = checkIfMissingThumb(FILES,THUMBS);
  console.log('runWithThumb', array)
  if (array.length) {
    const tasks = [];

    for (let i = 0; i < array.length; i++) {
      let filename = array[i];

      tasks.push(function(callback) {
        let url = `${baseUrl}files/${filename}`
        return CoreControls.createDocument(url, {}).then(doc => {
          console.log('task calling loadThumbnailAsync', filename, doc)
          setTimeout(() => {
            doc.loadThumbnailAsync(0, function(img, index) {
              let result;
              if (img instanceof Image) {
                // canvas.setAttribute('crossOrigin', 'anonymous');
                var _canvas = document.createElement("canvas");
                var num = 2
                var width = img.width / num
                var height = img.height / num

                _canvas.width = width
                _canvas.height = height
                var ctx = _canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                let dataURL = _canvas.toDataURL("image/png");
                result = {
                  data: dataURL,
                  filename
                }
              } else {
                let dataURL = img.toDataURL("image/png");
                result = {
                  data: dataURL,
                  filename
                }
              }
              console.log('task drawn', result)
              doc.unloadResources();
              return callback(null, result);
            });
           }, 100);

        });
      });
    }
    console.log('tasks', tasks)
    async.series(tasks,
      // optional callback
      function(err, results) {
        console.log('finish',results);
        let files = results.map(item => {
          let name = item.filename.split('.').slice(0, -1).join('.');
          return dataURLtoFile(item.data, name + '.png');
        });
        // let files = results.map(item => base64ToBlob(item.data.split(',')[1], 'image/png'));
        // const file = new File([files[0]], "filename.jpeg");

        const formData = new FormData();
        // formData.append('image', file)
        for (let i = 0; i < files.length; i++) {
          let file = files[i];
          console.log(file)
          formData.append('files[]', file);
        }
        console.log(formData)
        fetch(imageUploadURL, {
          method: 'POST',
          body: formData
        }).then(response => {
          response.json().then(res => {
            if (res && res.length) {
              res = res.filter(removeNonFileFilter)
            }
            console.log(res);
            window.updateThumbs(res)
          })

        });

      });

  }

}
runWithThumb();

function dataURLtoFile(dataurl, filename) {
  let arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, {type:mime});
}

function base64ToBlob(base64, mime) {
    mime = mime || '';
    let sliceSize = 1024;
    let byteChars = window.atob(base64);
    let byteArrays = [];

    for (let offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
        let slice = byteChars.slice(offset, offset + sliceSize);

        let byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        let byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: mime});
}
