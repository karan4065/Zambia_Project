/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import Student from "../pages/Student";

export const uploadPhoto = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<string>("http://localhost:5000/uploadPhoto", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Error uploading image");
  }
};

export const report = async () => {
  return await axios.get("http://localhost:5000/reportsdata");
};


//Student Operations
export const createStudent = async (student: Student) => {
  try {
    const response = await axios.post("http://localhost:5000/students", student);
    return response.data;
  } catch (error) {
    throw new Error("Error creating student");
  }
};

export const updateStudent = async (studentId: number,editableStudent:any) => {
  try {
    const response = await axios.get(`http://localhost:5000/students/rollNo`, {
      params: { rollno: editableStudent.rollNo, standard : editableStudent.standard }
    });
    const currentData = response.data;
    if(editableStudent.url){
      console.log(editableStudent.url);
      const updateData = { ...currentData, photoUrl: editableStudent.url};
      return await axios.put(`http://localhost:5000/update/student/${studentId}`, updateData);
    }
    return await axios.put(`http://localhost:5000/update/student/${studentId}`, editableStudent);  
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};


export const deleteStudent = async (studentId: number) => {
  try {
    await axios.delete("http://localhost:5000/delete/students", {
      params: {
        studentId: studentId,
      },
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};


// As per standard
export const fetchAllStudents = async (std: string) => {
  try {
    const response = await axios.get("http://localhost:5000/getallstudent", {
      params: { std },
    });
    return response.data.result;
  } catch (error) {
    throw new Error("Error fetching students");
  }
};

// As per scholarship search

export const fetchAllStudentsSc = async()=>{
  try{
    const res = await axios.get("http://localhost:5000/getallstudentsc");
    return res.data;
  }catch(error){
    throw new Error("Error fetching students");
  }
}

export const downloadStudentsExcel = async () => {
  return await axios.get('http://localhost:5000/excelstudents', {
    responseType: 'blob',
  });
};

export const uploadStudentsFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return await axios.post('http://localhost:5000/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Attendance Routes

export const uploadAttendance  = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return await axios.post('http://localhost:5000/uploadAttendance', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


export const fetchStandards = async () => {
    return await axios.get("http://localhost:5000/getstandards");
};
  
export const fetchSubjects = async (selectedStandard:string) => {
    return await axios.get("http://localhost:5000/getsubjects",{
      params :{
        selectedStandard
      }
    });
};
  
export const fetchStudents = async (standard: string) => {
    return await axios.get(`http://localhost:5000/getattendancelist?standard=${standard}`);
};
  
export const submitAttendance = async (data: unknown) => {
    return await axios.post("http://localhost:5000/submitattendance", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
};

export const downloadAttendance = async () => {
  return await fetch('http://localhost:5000/downloadattendance');
};


// New API calls for Hostel

export const downloadHosteldata = async () => {
  console.log("here too");
  return await axios.get('http://localhost:5000/downloadhosteldata', {
    responseType: 'blob',
  });
};

export const uploadHosteldata = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return await axios.post('http://localhost:5000/uploadHostel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


export const fetchHostelData = async () => {
    return await axios.get('http://localhost:5000/gethosteldata');
  };
  
  export const submitHostelData = async (hostelData: unknown) => {
    return await axios.post('http://localhost:5000/hosteldata', hostelData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
  
  export const searchStudent = (rollNo: number, standard: string ) => {
    return axios.get('http://localhost:5000/students/rollNo', {
      params: { rollno: rollNo, standard }
    });
  };
  
  export const deleteHostelData = async (data: unknown) => {
    return await axios.post("http://localhost:5000/hostel/delete", data, {
      headers: {
        "Content-Type": "application/json",
      }
    });
  };
  
  export const updateHostelData = async (data: unknown) => {
    return await axios.post("http://localhost:5000/updatehostel", data, {
      headers: {
        "Content-Type": "application/json",
      }
    });
  };


  //marks

  export const downloadMarks = async () => {
    console.log("here too");
    return await axios.get('http://localhost:5000/downloadMarks', {
      responseType: 'blob',
    });
  };
  
  export const uploadMarks = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
  
    return await axios.post('http://localhost:5000/uploadMarks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  export const addMarks = async (formData: unknown) => {
    return await axios.post("http://localhost:5000/add", formData);
  };
  
  export const searchMarks = async (params: number | string, standard: string) => {
    return await axios.get("http://localhost:5000/marks/search", {
      params: {
        params,
        standard
      }
    });
  };

  //fees


  export const downloadfeedata = async () => {
    console.log("here too");
    return await axios.get('http://localhost:5000/downloadfeedata', {
      responseType: 'blob',
    });
  };
  
  export const uploadfeedata = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
  
    return await axios.post('http://localhost:5000/uploadFee', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  export const fetchStudentFees = async (standard: string, rollNo: string) => {
    return await axios.get("http://localhost:5000/fees/details", {
      params: { standard: standard.trim(), roll_no: rollNo.trim() },
    });
  };
  
  export const addFeeInstallment = async (installment: unknown) => {
    return await axios.post("http://localhost:5000/fees/add", installment);
  };

  export const feetable = async (id:number,title:string)=>{
    const res = await axios.get("http://localhost:5000/feetable", {
      params: {
        id,
        title,
      },
    });

    return res;
  }


// control panel

export const addStandard = async(data : any)=>{
  const res = await axios.post("http://localhost:5000/control/standard", {
      std : data.std,
      totalFees : data.totalFees,
      category: data.category,
      // subjects : data.subjects
  }, {
    headers : {
      'Content-Type' : 'application/json'
    }
  })
  return res;
}

export const fetchStandardsByCategory = async () => {
  const res = await axios.get('http://localhost:5000/control/standardsByCategory');
  return res.data;
}

export const addSubjects = async(data : any)=>{
  const res = await axios.post("http://localhost:5000/control/subjects", {
      std : data.std,
      subjects : data.subjects
  }, {
    headers : {
      'Content-Type' : 'application/json'
    }
  })
  return res;
}

export const addControlValues = async(data : any) =>{
  const payload = {
    number_of_hostel_bed: data.num_of_beds,
    institutioName: data.InstitutionName,
    hostelName: data.hostelName,
    schoolAddress: data.schoolAddress,
    totalFee: data.totalFee,
    schoolLogo: data.url,
    lunchFee: data.lunchFee,
    year: data.year, // required: session year
  };

  const res = await axios.post("http://localhost:5000/changesFromControlPanel", payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res;
}

export const constants_from_db = async ()=>{
  const data = await axios.get("http://localhost:5000/getChanges");
  return data || {};
}


export const currentSession = async (year : string)=>{
  return await axios.post("http://localhost:5000/session",{
    year : year
  });
}

export const getCurrentSession = async ()=>{
  return await axios.get("http://localhost:5000/getSessions");
}

export const DownloadScholarshipStudent = async()=>{
  return await axios.get('http://localhost:5000/scholarshipStudents', {
    responseType: 'blob',
  });
}

export const getInstitutionNameAndLogo = async () => {
  try {
    const response = await axios.get("http://localhost:5000/getChanges");
    return response.data;
  } catch (error) {
    console.error("Error fetching institution name:", error);
    return "School"; // Fallback in case of an error
  }
};

export const fetchControlConfig = async (year: string) => {
  try {
    const resp = await axios.get('http://localhost:5000/getChanges', { params: { year } });
    return resp.data;
  } catch (err) {
    return null;
  }
};


export const getCredentials = async (username: string, password: string) => {
  try {
    const response = await axios.post("http://localhost:5000/credentials", {
      username,
      password,
    });
    return response.data; 
  } catch (error: any) {
    console.error("Error while fetching credentials:", error);
    throw new Error(error.response?.data?.message || "Backend Error.");
  }
};

export const uploadSchoolLogo = async (file: File)=>{
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<string>("http://localhost:5000/uploadSchoolLogo", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }catch (error) {
    throw new Error("Error uploading image");
  }

}

export const fetchInstallments = async ()=>{
  const response = await axios.get("http://localhost:5000/getInstallments");
  if(response){
    return response.data;
  }
}

// Inventory Management APIs
export const fetchInventory = async () => {
  try {
    const response = await axios.get("http://localhost:5000/inventory");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching inventory");
  }
};

export const createInventoryItem = async (data: any) => {
  try {
    const response = await axios.post("http://localhost:5000/inventory", data);
    return response.data;
  } catch (error) {
    throw new Error("Error creating inventory item");
  }
};

export const updateInventoryItem = async (id: number, data: any) => {
  try {
    const response = await axios.put(`http://localhost:5000/inventory/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error("Error updating inventory item");
  }
};

export const deleteInventoryItem = async (id: number) => {
  try {
    const response = await axios.delete(`http://localhost:5000/inventory/${id}`);
    return response.data;
  } catch (error) {
    throw new Error("Error deleting inventory item");
  }
};

export const getStudentInventory = async (studentId: number) => {
  try {
    const response = await axios.get(`http://localhost:5000/student-inventory/${studentId}`);
    return response.data;
  } catch (error) {
    throw new Error("Error fetching student inventory");
  }
};

export const assignInventoryToStudent = async (data: any) => {
  try {
    const response = await axios.post("http://localhost:5000/student-inventory", data);
    return response.data;
  } catch (error) {
    throw new Error("Error assigning inventory to student");
  }
};

// Bus Station Operations
export const fetchBusStations = async () => {
  try {
    const response = await axios.get("http://localhost:5000/busStations");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching bus stations");
  }
};

export const createBusStation = async (data: any) => {
  try {
    const response = await axios.post("http://localhost:5000/busStations", data);
    return response.data;
  } catch (error) {
    throw new Error("Error creating bus station");
  }
};

export const updateBusStation = async (id: number, data: any) => {
  try {
    const response = await axios.put(`http://localhost:5000/busStations/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error("Error updating bus station");
  }
};

export const deleteBusStation = async (id: number) => {
  try {
    const response = await axios.delete(`http://localhost:5000/busStations/${id}`);
    return response.data;
  } catch (error) {
    throw new Error("Error deleting bus station");
  }
};

// Dashboard APIs
export const fetchDashboardStudents = async () => {
  try {
    const response = await axios.get("http://localhost:5000/dashboard/students");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching students");
  }
};

export const fetchDashboardFees = async (filterClass?: string, filterCategory?: string) => {
  try {
    const params: any = {};
    if (filterClass) params.class = filterClass;
    if (filterCategory) params.category = filterCategory;

    const response = await axios.get("http://localhost:5000/dashboard/fees", { params });
    return response.data;
  } catch (error) {
    throw new Error("Error fetching fees");
  }
};

export const fetchDashboardTransport = async () => {
  try {
    const response = await axios.get("http://localhost:5000/dashboard/transport");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching transport");
  }
};

export const fetchDashboardLunch = async () => {
  try {
    const response = await axios.get("http://localhost:5000/dashboard/lunch");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching lunch");
  }
};

export const fetchDashboardTeachers = async () => {
  try {
    const response = await axios.get("http://localhost:5000/dashboard/teachers");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching teachers");
  }
};

export const fetchDashboardSections = async () => {
  try {
    const response = await axios.get("http://localhost:5000/dashboard/sections");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching sections");
  }
};

export const fetchFeesPending = async (filterSession?: string, filterClass?: string, filterCategory?: string) => {
  try {
    const params: any = {};
    if (filterSession) params.session = filterSession;
    if (filterClass) params.class = filterClass;
    if (filterCategory) params.category = filterCategory;

    const response = await axios.get("http://localhost:5000/dashboard/fees-pending", { params });
    return response.data;
  } catch (error) {
    throw new Error("Error fetching fees pending");
  }
};

export const downloadBackupZip = async () => {
  try {
    const response = await axios.get("http://localhost:5000/dashboard/backup");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching backup data");
  }
};

// CRUD Operations for Standards
export const getAllStandards = async () => {
  try {
    const response = await axios.get("http://localhost:5000/control/standards");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching standards");
  }
};

export const updateStandard = async (std: string, data: any) => {
  try {
    const response = await axios.put(`http://localhost:5000/control/standard/${std}`, data);
    return response.data;
  } catch (error) {
    throw new Error("Error updating standard");
  }
};

export const deleteStandard = async (std: string) => {
  try {
    const response = await axios.delete(`http://localhost:5000/control/standard/${std}`);
    return response.data;
  } catch (error) {
    throw new Error("Error deleting standard");
  }
};

// Get subjects for a standard
export const getSubjectsForStandard = async (std: string) => {
  try {
    const response = await axios.get(`http://localhost:5000/control/subjects/${std}`);
    return response.data;
  } catch (error) {
    throw new Error("Error fetching subjects");
  }
};

// Delete a subject
export const deleteSubject = async (id: number) => {
  try {
    const response = await axios.delete(`http://localhost:5000/control/subject/${id}`);
    return response.data;
  } catch (error) {
    throw new Error("Error deleting subject");
  }
};

// Add subjects with installment
export const addSubjectsWithInstallment = async (data: any) => {
  try {
    const response = await axios.post("http://localhost:5000/control/subjects", data);
    return response.data;
  } catch (error) {
    throw new Error("Error adding subjects");
  }
};

// Session Management
export const getAllSessions = async () => {
  try {
    const response = await axios.get("http://localhost:5000/getSessions");
    return response.data;
  } catch (error) {
    throw new Error("Error fetching sessions");
  }
};

export const addSession = async (year: string) => {
  try {
    const response = await axios.post("http://localhost:5000/session", { year });
    return response.data;
  } catch (error) {
    throw new Error("Error adding session");
  }
};
// Marks Management - Bulk Operations
export const fetchSubjectsWithTotalMarks = async (standard: string) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/subjects-with-marks/${standard}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subjects with marks:", error);
    throw new Error("Error fetching subjects with marks");
  }
};

export const submitBulkMarks = async (studentId: number, marksData: any[], examinationType: string) => {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/marks/bulk/${studentId}`,
      { marksData, examinationType }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error submitting bulk marks:", error);
    throw error.response?.data || error;
  }
};

export const submitSingleMark = async (studentId: number, subjectId: number, subjectName: string, examinationType: string, obtainedMarks: number, totalMarks: number) => {
  try {
    const response = await axios.post('http://localhost:5000/api/marks', {
      studentId,
      subjectId,
      subjectName,
      examinationType,
      obtainedMarks,
      totalMarks,
      percentage: ((obtainedMarks / totalMarks) * 100).toFixed(2),
    });
    return response.data;
  } catch (error: any) {
    console.error("Error submitting marks:", error);
    throw error.response?.data || error;
  }
};

export const getStudentMarksForStandard = async (studentId: number, standard: string, examinationType: string) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/marks-by-standard/${studentId}/${standard}/${examinationType}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching student marks:", error);
    throw new Error("Error fetching student marks");
  }
};