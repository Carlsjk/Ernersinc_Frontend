import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
} from "antd";
import { requestSquematic } from "./constants/Commons";

const EditableContext = React.createContext(null);

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  type,
  record,
  handleUpdate,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleUpdate({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      <Alert message="Error" description={errInfo} type="error" showIcon />;
    }
  };

  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        {type === "select" ? (
          <Select
            defaultValue="Seleccione una opcion"
            style={{ width: "100%" }}
            onPressEnter={save}
            defaultActiveFirstOption
            ref={inputRef}
            options={[
              {
                value: "disabled",
                disabled: true,
                label: "Seleccione una opcion",
              },
              {
                value: "CÉDULA DE CIUDADANÍA",
                label: "Cedula de ciudadania",
              },
              {
                value: "PASAPORTE",
                label: "Pasaporte",
              },
              {
                value: "CÉDULA DE EXTRANGERÍA",
                label: "Cedula de extrangeria",
              },
            ]}
          />
        ) : (
          <Input ref={inputRef} onPressEnter={save} onBlur={save} />
        )}
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};

const App = () => {
  const [dataSource, setDataSource] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [createData, setCreateData] = useState({
    document_type: "",
    document: "",
    names: "",
    last_names: "",
    hobbie: "",
  });

  const [alertIsOpen, setAlertIsOpen] = useState({
    displayErrorAlert: false,
    displaySuccessAlert: false,
  });

  const fetchData = async () => {
    const res = await requestSquematic("GET", "/api/persons/", {});
    setDataSource(res.results);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const defaultColumns = [
    {
      title: "id",
      dataIndex: "id",
      editable: false,
    },
    {
      title: "Tipo de documento",
      dataIndex: "document_type",
      editable: true,
      type: "select",
    },
    {
      title: "Documento",
      dataIndex: "document",
      editable: true,
    },
    {
      title: "Nombres",
      dataIndex: "names",
      width: "30%",
      editable: true,
    },
    {
      title: "Apellidos",
      dataIndex: "last_names",
      editable: true,
    },
    {
      title: "Hobbies",
      dataIndex: "hobbie",
      editable: true,
    },
    {
      title: "operation",
      dataIndex: "operation",
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDelete(record.id)}
          >
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const countDown = () => {
    let secondsToGo = 5;
    setTimeout(() => {
      setAlertIsOpen({
        displayErrorAlert: false,
        displaySuccessAlert: false,
      });
    }, secondsToGo * 1000);
  };

  const handleDelete = async (key) => {
    const newData = dataSource.filter((item) => item.id !== key);
    setDataSource(newData);
    const res = await requestSquematic("DELETE", "/api/persons/" + key, {});
    console.log(res);
    if (res.mensaje === "Eliminado correctamente") {
      setAlertIsOpen({
        displaySuccessAlert: true,
      });
    } else {
      setAlertIsOpen({
        displayErrorAlert: true,
      });
    }
    fetchData();
    countDown();
  };

  const handleAdd = () => {
    setIsOpen(true);
  };

  const handleChange = useCallback(
    (value) => {
      setCreateData((state) => ({ ...state, ...value }));
    },
    [setCreateData]
  );

  const handleSave = async () => {
    setIsOpen(false);
    const res = await requestSquematic("POST", "/api/persons/", createData);
    if (res) {
      setAlertIsOpen({
        displaySuccessAlert: true,
      });
    } else {
      setAlertIsOpen({
        displayErrorAlert: true,
      });
    }
    countDown();
    fetchData();
  };

  const handleUpdate = async (row) => {
    const res = await requestSquematic(
      "PUT",
      "/api/persons/" + row.id + "/",
      row
    );

    if (res) {
      setAlertIsOpen({
        displaySuccessAlert: true,
      });
    } else {
      setAlertIsOpen({
        displayErrorAlert: true,
      });
    }
    countDown();
    fetchData();
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        type: col.type,
        title: col.title,
        handleUpdate,
      }),
    };
  });
  return (
    <div
      style={{
        marginTop: 16,
        padding: 10,
      }}
    >
      <div
        style={{
          zIndex: 10,
          position: "absolute",
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {alertIsOpen.displaySuccessAlert && (
          <Alert
            message="Operacion finalizada con exito"
            description="La operacion a sido realizada exitosamente"
            type="success"
            closable
            showIcon
            style={{
              width: 500,
            }}
          />
        )}

        {alertIsOpen.displayErrorAlert && (
          <Alert
            message="Error"
            description="La opreacion deseada ha fallado"
            type="error"
            closable
            showIcon
            style={{
              width: 500,
            }}
          />
        )}
      </div>

      <Modal
        title={"Create"}
        open={isOpen}
        onOk={handleSave}
        destroyOnClose={true}
        bodyStyle={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onCancel={() => {
          setCreateData({
            document_type: "",
            document: "",
            names: "",
            last_names: "",
            hobbie: "",
          });
          setIsOpen(false);
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 5,
            width: "70%",
          }}
        >
          <Select
            defaultValue="Seleccione una opcion"
            style={{ width: "100%" }}
            onChange={(e) => handleChange({ document_type: e })}
            defaultActiveFirstOption
            options={[
              {
                value: "disabled",
                disabled: true,
                label: "Seleccione una opcion",
              },
              {
                value: "CÉDULA DE CIUDADANÍA",
                label: "Cedula de ciudadania",
              },
              {
                value: "PASAPORTE",
                label: "Pasaporte",
              },
              {
                value: "CÉDULA DE EXTRANGERÍA",
                label: "Cedula de extrangeria",
              },
            ]}
          />
          <Input
            placeholder="Numero del documento"
            onChange={(e) => handleChange({ document: e.target.value })}
          ></Input>
          <Input
            placeholder="Nombre"
            onChange={(e) => handleChange({ names: e.target.value })}
          ></Input>
          <Input
            placeholder="Apellidos"
            onChange={(e) => handleChange({ last_names: e.target.value })}
          ></Input>
          <Input
            placeholder="Hobbie"
            onChange={(e) => handleChange({ hobbie: e.target.value })}
          ></Input>
        </div>
      </Modal>
      <Button
        onClick={fetchData}
        type="default green"
        style={{
          marginBottom: 16,
          marginRight: 10,
        }}
      >
        Refresh
      </Button>
      <Button
        onClick={handleAdd}
        type="primary"
        style={{
          marginBottom: 16,
        }}
      >
        Create
      </Button>
      <Table
        components={components}
        rowClassName={() => "editable-row"}
        bordered
        dataSource={dataSource}
        columns={columns}
      />
    </div>
  );
};
export default App;
