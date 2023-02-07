import React, { forwardRef, useState, useEffect, useImperativeHandle }  from 'react';
import {  Button,  Col,  Row,  TabPane } from "reactstrap";
import {connect} from "react-redux";
import ReactDataGrid from "react-data-grid"
import $ from 'jquery'

const defaultColumnProperties = {
  width: 150
};

const ladColumns = [
  { key: "lbl", name: "Label", editable: true },
  { key: "def1", name: "Definition", editable: true },
  { key: "def2", name: "Definition", editable: true },
  { key: "def3", name: "Definition", editable: true },
  { key: "def4", name: "Definition", editable: true },
  { key: "def5", name: "Definition", editable: true },
  { key: "def6", name: "Definition", editable: true },
  { key: "def7", name: "Definition", editable: true }
].map(c => ({ ...c, ...defaultColumnProperties }));

const defaultParsePaste = str => str.split(/\r\n|\n|\r/).map(row => row.split('\t'));

const LADSubTabPanel = (props) => {

  const [rowIndex, setRowIndex] = useState(0)
  const [colIndex, setColIndex] = useState(0)
  const [inFocus, setInFocus] = useState(false)
  const [wrapperRef, setWrapperRef] = useState(null)
  const [gridRef, setGridRef] = useState(null)
  const [searchResult, setSearchResult] = useState([])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  });

  useEffect(() => {
    if (props.searchVal === "" || props.activeId !== props.id) {
      setSearchResult([])
      refreshGrid()

      if (props.activeId === props.id)
        props.updateSearchResult(props.id, { total: 0, curIndex: -1 })

      return
    }

    const result = search(props.rows)
    setTimeout(() => {
      console.log('------ update search result: ', result)
      props.updateSearchResult(props.id, { total: result.total, curIndex: result.curIndex })
    }, 500)

  }, [props.nextSearch])

  /**
   * update grid with new rows
   * @param rows
   */
  const updateGrid = (rows) => {
    const result = search(rows)
    resetSearchResultIndex(result.total)

    props.updateGrid(rows)
  }

  /**
   * reset search result row index
   */
  const resetSearchResultIndex = (total) => {
    props.updateSearchResult(props.id, { total: total, curIndex: -1 })
  }

  /**
   * search data with search value
   * @param rows
   */
  const search = (rows) => {
    console.log('--------- search lad -----------')
    let findData = []
    for (let i = 0; i < rows.length; i++) {
      for (let j = 1; j < 8; j++) {
        let value = ""
        switch (j) {
          case 1:
            value = rows[i].def1
            break;
          case 2:
            value = rows[i].def2
            break;
          case 3:
            value = rows[i].def3
            break;
          case 4:
            value = rows[i].def4
            break;
          case 5:
            value = rows[i].def5
            break;
          case 6:
            value = rows[i].def6
            break;
          case 7:
            value = rows[i].def7
            break;
        }

        if (value.includes(props.searchVal)) {
          findData.push({ rowIndex: i, colIndex: j })
        }
      }
    }

    console.log(`>>>> row index: ${rowIndex}, col index: ${colIndex} `)

    let gridCanvas = gridRef.getDataGridDOMNode().querySelector('.react-grid-Canvas')
    let initRowIndex = gridCanvas.scrollTop / gridRef.getRowOffsetHeight()
    let lastRowIndex = Math.max(initRowIndex, rowIndex)

    // find index
    let curIndex = -1
    for (let i = 0; i < findData.length; i++) {
      if (findData[i].rowIndex >= lastRowIndex) {
        curIndex = i
        console.log(`>>>> find data row index: ${findData[i].rowIndex}, col index: ${findData[i].colIndex} `)
        setRowIndex(findData[i].rowIndex)
        setColIndex(findData[i].colIndex)
        break
      }
    }

    if (curIndex === -1 && findData.length > 0) {
      curIndex = 0
      setRowIndex(findData[0].rowIndex)
      setColIndex(findData[0].colIndex)
    }

    console.log(`>>>> row index: ${rowIndex}, col index: ${colIndex} `)

    // scroll to find row index
    if (findData.length > 0 && curIndex >= 0) {
      let top = gridRef.getRowOffsetHeight() * findData[curIndex].rowIndex;
      let gridCanvas = gridRef.getDataGridDOMNode().querySelector('.react-grid-Canvas');
      gridCanvas.scrollTop = top;

      setTimeout(() => {
        refreshGrid()
      }, 500)
    }

    // set search result
    setSearchResult(findData)

    console.log('>>>> search result: ', findData)
    console.log('>>>> cur index: ', curIndex)

    return { total: findData.length, curIndex: curIndex }
  }

  /**
   * refresh grid
   */
  const refreshGrid = () => {
    if (gridRef == null)  return

    console.log('>>>> searchVal: ', props.searchVal)

    let gridCanvas = gridRef.getDataGridDOMNode().querySelector('.react-grid-Canvas');
    let initRowIndex = gridCanvas.scrollTop / gridRef.getRowOffsetHeight()
    let rows = gridCanvas.children[1].children;

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].children.length; j++) {
        const cell = rows[i].children[j]
        let value = cell.getAttribute('value')

        if (value !== undefined && value != null && props.searchVal != "" && value.includes(props.searchVal)) {
            console.log('>>>>> value: ', value)
            $(cell).css({'background': 'yellow'})
        } else {
          $(cell).css({'background': 'white'})
        }
      }
    }
  }

  /**
   * handle mouse down event
   * @param e
   */
  const handleMouseDown = (e) => {
    if (wrapperRef.contains(e.target) && !inFocus) {
      setInFocus(true)
      e.stopPropagation()
      e.preventDefault()

      console.log(">>> focus in")
      resetSearchResultIndex(searchResult.length)
    }
    if (!wrapperRef.contains(e.target) && inFocus) {
      setInFocus(false)
      console.log(">>> focus out")
    }
  }

  /**
   * handle key down event
   * @param e
   */
  const handleKeyDown = (e) => {
    if (wrapperRef.contains(e.target) && !inFocus) {
      setInFocus(true)
      e.stopPropagation()
      e.preventDefault()
      console.log(">>> focus in")
    }
    if (!wrapperRef.contains(e.target) && inFocus) {
      setInFocus(false)
      console.log(">>> focus out")
    }
  };

  /**
   * handle paste event
   * @param e
   */
  const handlePaste = (e) => {
    if (inFocus) {
      e.preventDefault()
      e.stopPropagation()
      const pasteData = defaultParsePaste(e.clipboardData.getData('text/plain'));

      let rows = props.rows
      let rowIdx = rowIndex
      let colIdx = colIndex
      for (let row of pasteData) {
        for (let cell of row) {
          if (colIdx === 0) {
            if (rowIdx >= rows.length) {
              rows.push({lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''})
            }

            if (cell.startsWith("*")) {
              rows[rowIdx].lbl = cell
              colIdx = 1
              continue
            }

            colIdx++
          }

          // if cell starts with *, go to next row
          if (cell.startsWith("*")) {
            rowIdx++
            if (rowIdx >= rows.length) {
              rows.push({lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''})
            }
            rows[rowIdx].lbl = cell
            colIdx = 1
            continue
          }

          switch (colIdx) {
            case 1: rows[rowIdx].def1 = cell;  break;
            case 2: rows[rowIdx].def2 = cell;  break;
            case 3: rows[rowIdx].def3 = cell;  break;
            case 4: rows[rowIdx].def4 = cell;  break;
            case 5: rows[rowIdx].def5 = cell;  break;
            case 6: rows[rowIdx].def6 = cell;  break;
            case 7: rows[rowIdx].def7 = cell;  break;
          }

          colIdx = (colIdx + 1) % 8
          if (colIdx === 0) {
            rowIdx++
          }

        }
      }
      console.log(">>> pasted data: " + JSON.stringify(pasteData))

      updateGrid(rows)
    }
  };

  /**
   *
   * @param fromRow
   * @param toRow
   * @param updated
   */
  const onGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    const rows = props.rows.slice()
    for (let i = fromRow; i <= toRow; i++) {
      rows[i] = { ...rows[i], ...updated }
    }
    updateGrid(rows)
  }

  /**
   * this is called when the cell is selected
   * @param rowIdx
   * @param idx
   */
  const onCellSelected = ({ rowIdx, idx }) => {
    setRowIndex(rowIdx)
    setColIndex(idx)
    setInFocus(true)

    console.log(`>>> row index: ${rowIdx}, col index = ${idx}`)
    resetSearchResultIndex(searchResult.length)
  }

  /**
   * insert data to rowindex
   * @param data
   * @param rowIndex
   * @returns {*}
   */
  const insertRow = (data, rowIndex = -1) => {

    if (rowIndex === -1) { rowIndex = data.length; }
    let row = {lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''}
    data.splice(rowIndex, 0, row)

    return data;
  }

  /**
   * insert data above
   */
  const onInsertRowAbove = () => {
    let rows = insertRow(props.rows, rowIndex)
    updateGrid(rows)
  }

  /**
   * insert data row below
   */
  const onInsertRowBelow = () => {
    let index = Math.min(rowIndex + 1, props.rows.length)
    let rows = insertRow(props.rows, index)
    updateGrid(rows)
  }

  /**
   * insert data row end
   */
  const onInsertRowEnd = () => {
    let rows = insertRow(props.rows, props.rows.length)
    updateGrid(rows)
  }

  /**
   * insert cell
   */
  const onInsertCell = () => {
    let rowSize = props.rows.length

    let rows = props.rows

    let rowIdx = rowIndex
    let colIdx = colIndex
    if (colIdx === 0) colIdx++

    // first find stop row(the previous row of next label)
    let stopRowIndex = rowSize - 1
    for (let i = rowIdx + 1; i < rowSize; i++) {
      if (rows[i].lbl !== '') {
        stopRowIndex = i - 1
        console.log(">>> i " + i)
        break;
      }
    }

    console.log(">>> stop row index: " + stopRowIndex)

    // last cell of current label is not empty, add a row to last
    if (props.rows[stopRowIndex].def7 !== "") {
      rows = insertRow(props.rows, stopRowIndex + 1)
      stopRowIndex++
    }

    // shift cells to next position
    for (let i = stopRowIndex; i >= rowIdx; i--) {
      rows[i].def7 = rows[i].def6
      if (i === rowIdx && colIdx === 7) break

      rows[i].def6 = rows[i].def5
      if (i === rowIdx && colIdx === 6) break

      rows[i].def5 = rows[i].def4
      if (i === rowIdx && colIdx === 5) break

      rows[i].def4 = rows[i].def3
      if (i === rowIdx && colIdx === 4) break

      rows[i].def3 = rows[i].def2
      if (i === rowIdx && colIdx === 3) break

      rows[i].def2 = rows[i].def1
      if (i === rowIdx && colIdx === 2) break

      if (i > 0) {
        rows[i].def1 = rows[i - 1].def7
      }
    }

    switch (colIdx) {
      case 1:
        rows[rowIdx].def1 = ""
        break
      case 2:
        rows[rowIdx].def2 = ""
        break
      case 3:
        rows[rowIdx].def3 = ""
        break
      case 4:
        rows[rowIdx].def4 = ""
        break
      case 5:
        rows[rowIdx].def5 = ""
        break
      case 6:
        rows[rowIdx].def6 = ""
        break
      case 7:
        rows[rowIdx].def7 = ""
        break
      default:
        break
    }

    updateGrid(rows)
  }

  /**
   * delete row
   * @param data
   * @param rowIndex
   * @returns {*}
   */
  const deleteRow = (data, rowIndex = -1) => {
    // let newArray = data.slice()
    //
    // if (rowIndex === -1) { rowIndex = data.length - 1; }
    // newArray.splice(rowIndex, 1);
    //
    // return newArray;

    if (rowIndex === -1) { rowIndex = data.length - 1; }
    data.splice(rowIndex, 1);

    return data;
  }

  /**
   * delete current row
   */
  const onDeleteCurrentRow = () => {
    let rows = deleteRow(props.rows, rowIndex)
    updateGrid(rows)
  }

  /**
   * delete last row
   */
  const onDeleteLastRow = () => {
    let rows = deleteRow(props.rows, props.rows.length - 1)
    updateGrid(rows)
  }

  /**
   * delete current cell
   */
  const onDeleteCell = () => {
    let rowSize = props.rows.length

    let rows = props.rows

    let rowIdx = rowIndex
    let colIdx = colIndex

    // if the user is going to delete label
    if (colIdx === 0) {
      rows[rowIdx].lbl = ""
      updateGrid(rows)
      return
    }

    // shift cells to prev position
    let stopRowIndex = rowSize - 1;

    for (let i = rowIdx; i < rowSize; i++) {
      if (i > rowIdx && rows[i].lbl !== "") {
        stopRowIndex = i - 1
        break
      }

      if (i > rowIdx || colIdx <= 1)    rows[i].def1 = rows[i].def2
      if (i > rowIdx || colIdx <= 2)    rows[i].def2 = rows[i].def3
      if (i > rowIdx || colIdx <= 3)    rows[i].def3 = rows[i].def4
      if (i > rowIdx || colIdx <= 4)    rows[i].def4 = rows[i].def5
      if (i > rowIdx || colIdx <= 5)    rows[i].def5 = rows[i].def6
      if (i > rowIdx || colIdx <= 6)    rows[i].def6 = rows[i].def7
      if (i + 1 < rowSize - 1)          rows[i].def7 = rows[i + 1].def1

    }

    // empty the last cell of stoped row
    rows[stopRowIndex].def7 = ""

    // delete last row of label if all cells of last row of label are blank
    let bStopRowAllBlank = true;
    if (rows[stopRowIndex].lbl !== "")                          bStopRowAllBlank = false;
    if (bStopRowAllBlank && rows[stopRowIndex].def1 !== "")     bStopRowAllBlank = false;
    if (bStopRowAllBlank && rows[stopRowIndex].def2 !== "")     bStopRowAllBlank = false;
    if (bStopRowAllBlank && rows[stopRowIndex].def3 !== "")     bStopRowAllBlank = false;
    if (bStopRowAllBlank && rows[stopRowIndex].def4 !== "")     bStopRowAllBlank = false;
    if (bStopRowAllBlank && rows[stopRowIndex].def5 !== "")     bStopRowAllBlank = false;
    if (bStopRowAllBlank && rows[stopRowIndex].def6 !== "")     bStopRowAllBlank = false;
    if (bStopRowAllBlank && rows[stopRowIndex].def7 !== "")     bStopRowAllBlank = false;

    if (bStopRowAllBlank) {
      rows = deleteRow(rows, stopRowIndex)
    }

    updateGrid(rows)
    setTimeout(()=> {
      refreshGrid()
    }, 200)
  }

  /**
   * clear grid data
   */
  const onClearGridData = () => {
    let rows = []
    for (let i = 0; i < 8; i++) {
      let row = {lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''}
      rows.push(row)
    }

    updateGrid(rows)
  }

  /**
   * this is called on scrolling
   * @param evt
   */
  const onScroll = (evt) => {
    refreshGrid()
  }

  return (
    <TabPane tabId={props.id}>
      <div ref={el => {setWrapperRef(el)}}>
      <ReactDataGrid
        ref={(g) => setGridRef(g)}
        columns={ladColumns}
        rowGetter={i => props.rows[i]}
        rowsCount={props.rows.length}
        onGridRowsUpdated={onGridRowsUpdated}
        onCellSelected={onCellSelected}
        enableCellSelect={!props.disable}
        onScroll={onScroll}
      />
      </div>
      <div className="mt-2">
        <Row>
          <Col xs="12" md="10">
            <Button size="sm" color="primary" className="ml-3 mt-1 mb-2" onClick={onInsertRowAbove} disabled={props.disable}>Insert Row Above</Button>
            <Button size="sm" color="primary" className="ml-3 mt-1 mb-2"  onClick={onInsertRowBelow} disabled={props.disable}>Insert Row Below</Button>
            <Button size="sm" color="primary" className="ml-3 mt-1 mb-2"  onClick={onInsertRowEnd} disabled={props.disable}>Insert Row End</Button>
            <Button size="sm" color="primary" className="ml-3 mt-1 mb-2"  onClick={onInsertCell} disabled={props.disable}>Insert Cell</Button>
            <Button size="sm" color="primary" className="ml-3 mt-1 mb-2"  onClick={onDeleteCurrentRow} disabled={props.disable}>Delete Current Row</Button>
            <Button size="sm" color="primary" className="ml-3 mt-1 mb-2"  onClick={onDeleteLastRow} disabled={props.disable}>Delete Last Row</Button>
            <Button size="sm" color="primary" className="ml-3 mt-1 mb-2"  onClick={onDeleteCell} disabled={props.disable}>Delete Cell</Button>
          </Col>
          <Col xs="12" md="2" className="text-right">
            <Button size="sm" color="danger" className="mt-1 mb-2"  onClick={onClearGridData} disabled={props.disable}>Clear Tab Data</Button>
          </Col>
        </Row>
      </div>
    </TabPane>
  );
};

export default connect(
  state => ({}),
)(LADSubTabPanel);
